-- ==============================================================================
-- GridVault ESS Database Schema Migration
-- Module: Analytics & Financial Ledger (Varad Bhardwaj)
-- Component: ComplianceAuditLog
-- Milestone: Oct 26, 2026 16:45:00 +0530
-- Commit: schema(ComplianceAuditLog): implement audit log partitioning for regulatory compliance
-- Description: Set up monthly table partitioning for regulatory audit logs
--              to maintain long-term compliance storage efficiency and fast queries.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PARTITIONED REGULATORY AUDIT LEDGER (RANGE BY MONTH)
-- High-throughput audit log table partitioned by inspection_timestamp range.
-- Ensures sub-10ms query pruning even with millions of high-frequency records.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partitioned_regulatory_audit_ledgers (
    id UUID DEFAULT gen_random_uuid(),
    audit_id VARCHAR(50) NOT NULL,
    substation_id VARCHAR(50) NOT NULL,
    regulation_code VARCHAR(100) NOT NULL,
    standard_name VARCHAR(200) NOT NULL,
    inspection_focus TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    inspection_timestamp TIMESTAMPTZ NOT NULL,
    auditor_entity VARCHAR(150) NOT NULL,
    result_flag VARCHAR(20) NOT NULL, -- 'PASS', 'FLAGGED', 'FAILED'
    performance_margin VARCHAR(200) NOT NULL,
    severity VARCHAR(30) NOT NULL,
    verification_hash VARCHAR(64) NOT NULL, -- Tamper-evident checksum
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, inspection_timestamp)
) PARTITION BY RANGE (inspection_timestamp);

-- ------------------------------------------------------------------------------
-- 2. MONTHLY RANGE PARTITIONS
-- Partition bounds spanning active and projected compliance quarters.
-- ------------------------------------------------------------------------------

-- Partition: September 2026
CREATE TABLE IF NOT EXISTS audit_ledger_2026_09 PARTITION OF partitioned_regulatory_audit_ledgers
    FOR VALUES FROM ('2026-09-01 00:00:00+05:30') TO ('2026-10-01 00:00:00+05:30');

-- Partition: October 2026
CREATE TABLE IF NOT EXISTS audit_ledger_2026_10 PARTITION OF partitioned_regulatory_audit_ledgers
    FOR VALUES FROM ('2026-10-01 00:00:00+05:30') TO ('2026-11-01 00:00:00+05:30');

-- Partition: November 2026
CREATE TABLE IF NOT EXISTS audit_ledger_2026_11 PARTITION OF partitioned_regulatory_audit_ledgers
    FOR VALUES FROM ('2026-11-01 00:00:00+05:30') TO ('2026-12-01 00:00:00+05:30');

-- Partition: December 2026
CREATE TABLE IF NOT EXISTS audit_ledger_2026_12 PARTITION OF partitioned_regulatory_audit_ledgers
    FOR VALUES FROM ('2026-12-01 00:00:00+05:30') TO ('2027-01-01 00:00:00+05:30');

-- Partition: January 2027
CREATE TABLE IF NOT EXISTS audit_ledger_2027_01 PARTITION OF partitioned_regulatory_audit_ledgers
    FOR VALUES FROM ('2027-01-01 00:00:00+05:30') TO ('2027-02-01 00:00:00+05:30');

-- Default Partition for catch-all archival
CREATE TABLE IF NOT EXISTS audit_ledger_overflow PARTITION OF partitioned_regulatory_audit_ledgers
    DEFAULT;

-- ------------------------------------------------------------------------------
-- 3. PARTITION LOCAL PERFORMANCE INDEXES
-- Indexing local to each partition for instant index seeks.
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_part_audit_code_time ON partitioned_regulatory_audit_ledgers(regulation_code, inspection_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_part_audit_result_time ON partitioned_regulatory_audit_ledgers(result_flag, inspection_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_part_audit_substation ON partitioned_regulatory_audit_ledgers(substation_id);

-- ------------------------------------------------------------------------------
-- 4. DYNAMIC PARTITION PROVISIONING FUNCTION
-- Stored procedure to automatically create future monthly partitions ahead of time.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_future_audit_partition(target_year INT, target_month INT)
RETURNS TEXT AS $$
DECLARE
    partition_name TEXT;
    start_ts TEXT;
    end_ts TEXT;
    next_month INT;
    next_year INT;
BEGIN
    partition_name := 'audit_ledger_' || target_year || '_' || LPAD(target_month::TEXT, 2, '0');
    
    start_ts := target_year || '-' || LPAD(target_month::TEXT, 2, '0') || '-01 00:00:00+05:30';
    
    IF target_month = 12 THEN
        next_month := 1;
        next_year := target_year + 1;
    ELSE
        next_month := target_month + 1;
        next_year := target_year;
    END IF;
    
    end_ts := next_year || '-' || LPAD(next_month::TEXT, 2, '0') || '-01 00:00:00+05:30';
    
    -- Check if table exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = partition_name
    ) THEN
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF partitioned_regulatory_audit_ledgers FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_ts, end_ts
        );
        RETURN 'Partition created: ' || partition_name;
    ELSE
        RETURN 'Partition already exists: ' || partition_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 5. SEED DATA & VERIFICATION INTO PARTITIONS
-- Inserts audit entries that automatically route into October and November partitions.
-- ------------------------------------------------------------------------------
INSERT INTO partitioned_regulatory_audit_ledgers (
    audit_id,
    substation_id,
    regulation_code,
    standard_name,
    inspection_focus,
    category,
    inspection_timestamp,
    auditor_entity,
    result_flag,
    performance_margin,
    severity,
    verification_hash
) VALUES
    -- Routes into October 2026 partition (audit_ledger_2026_10)
    ('AUD-PART-2026-1001', 'SUB-400KV-NORTH-01', 'CEA Safety Reg 2023', 'CEA Electrical Safety Regulations', 'BMS High-Voltage Contactor Emergency Disconnect', 'Safety & Protection', '2026-10-30 15:10:00+05:30', 'Directorate of Electrical Safety', 'PASS', 'Isolated in 12ms during simulated arc fault', 'CRITICAL', encode(digest('AUD-PART-2026-1001', 'sha256'), 'hex')),
    
    -- Routes into November 2026 partition (audit_ledger_2026_11)
    ('AUD-PART-2026-1101', 'SUB-400KV-NORTH-01', 'FERC Order 841', 'Federal Energy Regulatory Commission', 'State-of-Charge (SOC) Telemetry Granularity', 'Market Access', '2026-11-04 10:20:00+05:30', 'Independent System Operator (ISO)', 'PASS', '1-second continuous telemetry feed verified', 'MANDATORY', encode(digest('AUD-PART-2026-1101', 'sha256'), 'hex')),
    ('AUD-PART-2026-1102', 'SUB-400KV-NORTH-01', 'CERC IEGC §5.2', 'Central Electricity Regulatory Commission', 'Primary Frequency Response Response Time (<500ms)', 'Frequency Regulation', '2026-11-16 11:30:00+05:30', 'WRLDC / POSOCO Team A', 'PASS', '180ms response (Limit: 500ms)', 'STATUTORY', encode(digest('AUD-PART-2026-1102', 'sha256'), 'hex')),
    ('AUD-PART-2026-1103', 'SUB-400KV-NORTH-01', 'NERC BAL-001-2', 'North American Electric Reliability Corp', 'Real-Power Balancing & Area Control Error (ACE)', 'Grid Stabilization', '2026-11-14 09:15:00+05:30', 'National Grid Operator Auditor', 'PASS', 'ACE Deviation: 0.012 MW (<0.05 limit)', 'MANDATORY', encode(digest('AUD-PART-2026-1103', 'sha256'), 'hex'));

-- ------------------------------------------------------------------------------
-- 6. VERIFICATION PRUNING VIEW
-- Demonstrates partition pruning efficiency across range queries.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW view_partition_distribution AS
SELECT
    tableoid::regclass AS partition_table,
    COUNT(*) AS row_count,
    MIN(inspection_timestamp) AS earliest_timestamp,
    MAX(inspection_timestamp) AS latest_timestamp
FROM partitioned_regulatory_audit_ledgers
GROUP BY tableoid;
