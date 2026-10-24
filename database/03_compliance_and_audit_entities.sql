-- ==============================================================================
-- GridVault ESS Database Schema Migration
-- Module: Analytics & Financial Ledger (Varad Bhardwaj)
-- Component: ComplianceAuditLog
-- Milestone: Oct 24, 2026 16:45:00 +0530
-- Commit: schema(ComplianceAuditLog): build compliance audit log and regulatory report entities
-- Description: Define entities for regional grid compliance rules (FERC/NERC),
--              historical audit trails, and scheduled automated reporting runs.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. REGULATORY STANDARDS & RULES
-- Authoritative regional grid reliability standards (CERC, NERC, CEA, IEEE, FERC).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS regulatory_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    authority VARCHAR(50) NOT NULL, -- 'CERC', 'NERC', 'CEA', 'IEEE', 'FERC'
    regulation_code VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'CERC IEGC §5.2', 'NERC BAL-001-2'
    standard_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Frequency Regulation', 'Grid Balancing', 'Safety & Protection'
    tolerance_threshold_desc VARCHAR(255) NOT NULL,
    severity_default VARCHAR(30) NOT NULL DEFAULT 'STATUTORY', -- 'STATUTORY', 'MANDATORY', 'TECHNICAL', 'CRITICAL'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. COMPLIANCE AUDIT TRAILS
-- Granular inspection audit records matching ComplianceAuditLog.jsx entries.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compliance_audit_trails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'AUD-2026-9041'
    standard_id UUID REFERENCES regulatory_standards(id),
    substation_id VARCHAR(50) NOT NULL DEFAULT 'SUB-400KV-NORTH-01',
    regulation_code VARCHAR(100) NOT NULL,
    standard_name VARCHAR(200) NOT NULL,
    inspection_focus TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    inspection_timestamp TIMESTAMPTZ NOT NULL,
    auditor_entity VARCHAR(150) NOT NULL,
    result_flag VARCHAR(20) NOT NULL, -- 'PASS', 'FLAGGED', 'FAILED'
    performance_margin VARCHAR(200) NOT NULL,
    severity VARCHAR(30) NOT NULL,
    raw_telemetry_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. COMPLIANCE REPORTS
-- Official compiled PDF filings and statutory quarterly compliance submissions.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'REP-CERC-2026-Q3'
    report_title VARCHAR(255) NOT NULL,
    description TEXT,
    authority VARCHAR(50) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    file_size_display VARCHAR(30) NOT NULL DEFAULT '2.4 MB',
    file_size_bytes BIGINT NOT NULL DEFAULT 2516582,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'Verified', -- 'Verified', 'Pending', 'Superseded'
    signed_checksum_sha256 VARCHAR(64) NOT NULL,
    pdf_filename VARCHAR(150) NOT NULL,
    metadata_tags TEXT[] NOT NULL DEFAULT ARRAY['Compliance', 'Statutory'],
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. AUTOMATED REPORTING SCHEDULES
-- Scheduled cron routines for periodic compliance verification runs.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automated_reporting_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(100) UNIQUE NOT NULL,
    authority VARCHAR(50) NOT NULL,
    cron_expression VARCHAR(50) NOT NULL DEFAULT '0 0 1 * *', -- e.g. 1st of every month
    frequency VARCHAR(30) NOT NULL DEFAULT 'MONTHLY', -- 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL'
    target_substations TEXT[] NOT NULL DEFAULT ARRAY['SUB-400KV-NORTH-01'],
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    notification_webhook_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_audit_trails_code ON compliance_audit_trails(regulation_code);
CREATE INDEX IF NOT EXISTS idx_audit_trails_date ON compliance_audit_trails(inspection_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trails_result ON compliance_audit_trails(result_flag);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_auth ON compliance_reports(authority, period_end DESC);

-- ------------------------------------------------------------------------------
-- 6. SEED DATA
-- Exact regulatory standards and audit trail records matching ComplianceAuditLog.jsx.
-- ------------------------------------------------------------------------------
INSERT INTO regulatory_standards (authority, regulation_code, standard_name, category, tolerance_threshold_desc, severity_default)
VALUES
    ('CERC', 'CERC IEGC §5.2', 'Central Electricity Regulatory Commission', 'Frequency Regulation', 'Primary Frequency Response Response Time (<500ms)', 'STATUTORY'),
    ('NERC', 'NERC BAL-001-2', 'North American Electric Reliability Corp', 'Grid Stabilization', 'Real-Power Balancing & Area Control Error (ACE <0.05 MW)', 'MANDATORY'),
    ('IEEE', 'IEEE 1547-2018 §4.2', 'IEEE Distributed Energy Interconnection', 'Fault Ride-Through', 'Low Voltage Ride-Through (LVRT) Capability (0.15 pu for 620ms)', 'TECHNICAL'),
    ('CEA', 'CEA Technical Grid Code', 'Central Electricity Authority Standards', 'Voltage Support', 'Reactive Power Export at Peak (Power Factor >= 0.95)', 'ADVISORY'),
    ('FERC', 'FERC Order 841', 'Federal Energy Regulatory Commission', 'Market Access', '1-second continuous telemetry feed granularity', 'MANDATORY'),
    ('CEA', 'CEA Safety Reg 2023', 'CEA Electrical Safety Regulations', 'Safety & Protection', 'BMS High-Voltage Contactor Emergency Disconnect (<15ms)', 'CRITICAL')
ON CONFLICT (regulation_code) DO NOTHING;

-- Seed historical audit records matching ComplianceAuditLog.jsx
INSERT INTO compliance_audit_trails (audit_id, regulation_code, standard_name, inspection_focus, category, inspection_timestamp, auditor_entity, result_flag, performance_margin, severity)
VALUES
    ('AUD-2026-9041', 'CERC IEGC §5.2', 'Central Electricity Regulatory Commission', 'Primary Frequency Response Response Time (<500ms)', 'Frequency Regulation', '2026-11-16 11:30:00+05:30', 'WRLDC / POSOCO Team A', 'PASS', '180ms response (Limit: 500ms)', 'STATUTORY'),
    ('AUD-2026-8924', 'NERC BAL-001-2', 'North American Electric Reliability Corp', 'Real-Power Balancing & Area Control Error (ACE)', 'Grid Stabilization', '2026-11-14 09:15:00+05:30', 'National Grid Operator Auditor', 'PASS', 'ACE Deviation: 0.012 MW (<0.05 limit)', 'MANDATORY'),
    ('AUD-2026-8730', 'IEEE 1547-2018 §4.2', 'IEEE Distributed Energy Interconnection', 'Low Voltage Ride-Through (LVRT) Capability', 'Fault Ride-Through', '2026-11-11 16:45:00+05:30', 'Interconnect Feeder Testing Lab', 'PASS', 'Stayed connected at 0.15 pu for 620ms', 'TECHNICAL'),
    ('AUD-2026-8619', 'CEA Technical Grid Code', 'Central Electricity Authority Standards', 'Reactive Power (MVAR) Export at Peak Load', 'Voltage Support', '2026-11-08 14:00:00+05:30', 'State Transco Inspector #04', 'FLAGGED', 'Inverter #2 power factor 0.94 (Target 0.95)', 'ADVISORY'),
    ('AUD-2026-8502', 'FERC Order 841', 'Federal Energy Regulatory Commission', 'State-of-Charge (SOC) Telemetry Granularity', 'Market Access', '2026-11-04 10:20:00+05:30', 'Independent System Operator (ISO)', 'PASS', '1-second continuous telemetry feed verified', 'MANDATORY'),
    ('AUD-2026-8388', 'CEA Safety Reg 2023', 'CEA Electrical Safety Regulations', 'BMS High-Voltage Contactor Emergency Disconnect', 'Safety & Protection', '2026-10-30 15:10:00+05:30', 'Directorate of Electrical Safety', 'PASS', 'Isolated in 12ms during simulated arc fault', 'CRITICAL')
ON CONFLICT (audit_id) DO NOTHING;

-- Seed reports matching ComplianceTable.jsx
INSERT INTO compliance_reports (report_code, report_title, description, authority, period_start, period_end, file_size_display, file_size_bytes, verification_status, signed_checksum_sha256, pdf_filename, metadata_tags)
VALUES
    ('REP-CERC-2026-Q3', 'CERC Grid Stability & Frequency Audit (Q3)', 'Statutory compliance verification of 50±0.05 Hz FCR response benchmarks.', 'CERC', '2026-07-01', '2026-09-30', '2.4 MB', 2516582, 'Verified', encode(digest('CERC-2026-Q3-STABILITY', 'sha256'), 'hex'), 'GridVault_CERC_Stability_Q3_2026.pdf', ARRAY['Frequency 50Hz', 'FCR Reserve', 'Statutory']),
    ('REP-CEA-2026-RES', 'CEA Mandatory Reserve Margin Compliance', 'Bimonthly spinning reserve and reactive power injection dispatch audit.', 'CEA', '2026-09-01', '2026-10-31', '1.8 MB', 1887436, 'Verified', encode(digest('CEA-2026-RESERVE-MARGIN', 'sha256'), 'hex'), 'GridVault_CEA_Reserve_Margin_2026.pdf', ARRAY['Spinning Reserve', 'MVAR Support', 'Grid Code']),
    ('REP-FERC-841-OCT', 'FERC Order 841 Energy Market Integration', 'Full audit trail of day-ahead locational marginal pricing and battery arbitrage.', 'FERC', '2026-10-01', '2026-10-31', '3.1 MB', 3250585, 'Verified', encode(digest('FERC-841-OCT-2026', 'sha256'), 'hex'), 'GridVault_FERC_Order841_Audit_2026.pdf', ARRAY['Order 841', 'Arbitrage', 'LMP Spot']),
    ('REP-CARBON-OCT26', 'National Clean Energy Carbon Offset Certificate', 'Certified 128.4 MT CO2 equivalent displacement ledger audited by BEE.', 'BEE', '2026-10-01', '2026-10-31', '940 KB', 962560, 'Verified', encode(digest('CARBON-OFFSET-OCT-2026', 'sha256'), 'hex'), 'GridVault_Carbon_Credit_Audit_Oct2026.pdf', ARRAY['Carbon Credits', 'ESG Report', 'BEE Certified']),
    ('REP-SLDC-NOV-WK1', 'SLDC Feeder Telemetry Reconciliation (W45)', 'Weekly state load despatch centre telemetry validation report.', 'SLDC', '2026-11-01', '2026-11-07', '1.2 MB', 1258291, 'Verified', encode(digest('SLDC-NOV-WK1-2026', 'sha256'), 'hex'), 'GridVault_SLDC_Telemetry_Recon_2026.pdf', ARRAY['SLDC Weekly', 'Substation Telemetry', 'Active Power'])
ON CONFLICT (report_code) DO NOTHING;
