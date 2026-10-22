-- ==============================================================================
-- GridVault ESS Database Schema Migration
-- Module: Analytics & Financial Ledger (Varad Bhardwaj)
-- Milestone: Oct 22, 2026 14:45:00 +0530
-- Commit: schema: define energy tariff structure and billing ledger
-- Description: Construct relational tables for time-of-use (TOU) tariff tiers,
--              peak demand charges, utility feed-in rates, and transaction ledgers.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TARIFF PLANS
-- Defines base utility commercial/industrial tariff contracts and schedules.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tariff_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    utility_provider VARCHAR(100) NOT NULL,
    voltage_level VARCHAR(50) DEFAULT '11kV', -- 11kV, 33kV, 66kV, 132kV
    billing_frequency VARCHAR(20) DEFAULT 'MONTHLY', -- MONTHLY, BI_MONTHLY
    flat_rate_reference NUMERIC(10, 4) NOT NULL DEFAULT 8.5000, -- Baseline flat rate for comparison (₹/kWh)
    currency VARCHAR(10) DEFAULT 'INR',
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. TIME-OF-USE (TOU) TARIFF TIERS
-- Models diurnal dynamic pricing tiers (off-peak valley, normal, super-peak).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS time_of_use_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tariff_plan_id UUID NOT NULL REFERENCES tariff_plans(id) ON DELETE CASCADE,
    tier_name VARCHAR(50) NOT NULL, -- 'Off-Peak Valley', 'Standard Normal', 'Super-Peak Stress'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    energy_rate_per_kwh NUMERIC(10, 4) NOT NULL, -- Energy purchase tariff (₹/kWh)
    day_type VARCHAR(30) DEFAULT 'ALL_DAYS', -- 'WEEKDAY', 'WEEKEND', 'ALL_DAYS'
    season VARCHAR(30) DEFAULT 'ALL_YEAR', -- 'SUMMER', 'WINTER', 'MONSOON', 'ALL_YEAR'
    rate_multiplier NUMERIC(5, 2) DEFAULT 1.00,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. PEAK DEMAND CHARGES
-- Surcharges levied on maximum registered kW demand during billing cycles.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS peak_demand_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tariff_plan_id UUID NOT NULL REFERENCES tariff_plans(id) ON DELETE CASCADE,
    demand_charge_per_kw_month NUMERIC(10, 2) NOT NULL DEFAULT 450.00, -- ₹/kW-month
    contracted_demand_kw NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
    ratchet_percentage NUMERIC(5, 2) NOT NULL DEFAULT 80.00, -- Minimum billing ratchet (e.g. 80% of contract)
    measurement_window_minutes INT NOT NULL DEFAULT 15, -- Standard 15-minute sliding integration window
    penalty_exceedance_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.50, -- 1.5x penalty above contract
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. UTILITY FEED-IN RATES
-- Export tariff compensation for clean energy injected back into the grid.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utility_feed_in_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tariff_plan_id UUID NOT NULL REFERENCES tariff_plans(id) ON DELETE CASCADE,
    export_rate_per_kwh NUMERIC(10, 4) NOT NULL DEFAULT 4.2500, -- Injected feed-in compensation (₹/kWh)
    export_mechanism VARCHAR(50) NOT NULL DEFAULT 'NET_BILLING', -- 'NET_METERING', 'NET_BILLING', 'GROSS_PPA'
    max_export_capacity_kw NUMERIC(10, 2) NOT NULL DEFAULT 5000.00,
    ancillary_fcr_incentive_rate NUMERIC(10, 4) DEFAULT 1.2000, -- Premium for fast frequency response
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. BILLING LEDGERS
-- High-level periodic billing statement ledger aggregating energy economics.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS billing_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_number VARCHAR(50) UNIQUE NOT NULL,
    substation_id VARCHAR(50) NOT NULL, -- e.g. 'SUB-400KV-NORTH-01'
    tariff_plan_id UUID NOT NULL REFERENCES tariff_plans(id),
    billing_period_start TIMESTAMPTZ NOT NULL,
    billing_period_end TIMESTAMPTZ NOT NULL,
    
    -- Consumption & Dispatch Volumes (kWh)
    total_imported_kwh NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    total_exported_kwh NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    off_peak_imported_kwh NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    normal_imported_kwh NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    super_peak_imported_kwh NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    ess_displaced_peak_kwh NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    
    -- Demand Peak Metrics (kW)
    recorded_peak_demand_kw NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    shaved_peak_demand_kw NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    billed_demand_kw NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Financial Totals (INR)
    gross_energy_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    demand_surcharge_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    export_feed_in_credit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    net_utility_bill NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    
    -- GridVault ESS Savings Proven
    baseline_flat_tariff_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    unmitigated_tou_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    arbitrage_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    peak_shaving_savings NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    net_money_saved NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    
    settlement_status VARCHAR(30) NOT NULL DEFAULT 'CALCULATED', -- 'DRAFT', 'CALCULATED', 'AUDITED', 'SETTLED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. TRANSACTION LEDGERS
-- Granular transactional ledger records detailing individual dispatch settlement events.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transaction_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_ledger_id UUID NOT NULL REFERENCES billing_ledgers(id) ON DELETE CASCADE,
    substation_id VARCHAR(50) NOT NULL,
    transaction_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transaction_type VARCHAR(50) NOT NULL, -- 'VALLEY_CHARGING_BUY', 'PEAK_DISCHARGE_DISPLACE', 'GRID_INJECTION_EXPORT', 'DEMAND_SHAVING_OFFSET'
    tariff_tier_name VARCHAR(50),
    energy_kwh NUMERIC(12, 4) NOT NULL,
    unit_rate NUMERIC(10, 4) NOT NULL,
    total_amount NUMERIC(14, 2) NOT NULL,
    cumulative_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    verification_hash VARCHAR(64), -- SHA-256 tamper-evident integrity hash
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. PERFORMANCE INDEXES
-- Optimizes timeseries range lookups and foreign key joins.
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tou_tiers_plan ON time_of_use_tiers(tariff_plan_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_peak_demand_plan ON peak_demand_charges(tariff_plan_id);
CREATE INDEX IF NOT EXISTS idx_feed_in_plan ON utility_feed_in_rates(tariff_plan_id);
CREATE INDEX IF NOT EXISTS idx_billing_ledgers_substation_date ON billing_ledgers(substation_id, billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_billing_ledgers_status ON billing_ledgers(settlement_status);
CREATE INDEX IF NOT EXISTS idx_transaction_ledgers_billing_time ON transaction_ledgers(billing_ledger_id, transaction_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_ledgers_type ON transaction_ledgers(transaction_type);

-- ------------------------------------------------------------------------------
-- 8. SEED DATA
-- Default tariff plans matching the GridVault ESS system configurations:
--  - Commercial Substation (160 MWh/mo, ₹8.20 flat, 480 kW peak)
--  - Industrial Feeder (220 MWh/mo, ₹8.80 flat, 650 kW peak)
--  - Municipal Smart Grid (310 MWh/mo, ₹9.10 flat, 820 kW peak)
-- ------------------------------------------------------------------------------
INSERT INTO tariff_plans (code, name, utility_provider, voltage_level, flat_rate_reference, currency)
VALUES
    ('COMM-HT-01', 'Commercial Substation Medium-Tension', 'State Electricity Distribution Co.', '11kV', 8.2000, 'INR'),
    ('IND-HT-02', 'Industrial Feeder High-Tension (HT)', 'Regional Transmission Utility', '33kV', 8.8000, 'INR'),
    ('MUNI-SG-03', 'Municipal Smart Grid Feeder', 'State Clean Energy Board', '22kV', 9.1000, 'INR')
ON CONFLICT (code) DO NOTHING;

-- Populate TOU tiers for Commercial Substation plan
DO $$
DECLARE
    comm_plan_id UUID;
    ind_plan_id UUID;
BEGIN
    SELECT id INTO comm_plan_id FROM tariff_plans WHERE code = 'COMM-HT-01' LIMIT 1;
    SELECT id INTO ind_plan_id FROM tariff_plans WHERE code = 'IND-HT-02' LIMIT 1;

    IF comm_plan_id IS NOT NULL THEN
        -- Commercial TOU Tiers
        INSERT INTO time_of_use_tiers (tariff_plan_id, tier_name, start_time, end_time, energy_rate_per_kwh, description)
        VALUES
            (comm_plan_id, 'Off-Peak Valley (Charging)', '23:00:00', '06:00:00', 3.8000, 'Optimal low-cost charging window for battery storage replenishment'),
            (comm_plan_id, 'Normal Mid-Day', '06:00:00', '18:00:00', 7.2000, 'Standard grid operational tariff band with solar generation offset'),
            (comm_plan_id, 'Super-Peak Stress (Discharging)', '18:00:00', '23:00:00', 12.5000, 'High-stress evening peaking tariff band targeted for battery dispatch');

        -- Commercial Peak Demand Charges
        INSERT INTO peak_demand_charges (tariff_plan_id, demand_charge_per_kw_month, contracted_demand_kw, ratchet_percentage)
        VALUES
            (comm_plan_id, 450.00, 480.00, 80.00);

        -- Commercial Feed-in Tariffs
        INSERT INTO utility_feed_in_rates (tariff_plan_id, export_rate_per_kwh, export_mechanism, max_export_capacity_kw)
        VALUES
            (comm_plan_id, 4.2500, 'NET_BILLING', 1000.00);
    END IF;

    IF ind_plan_id IS NOT NULL THEN
        -- Industrial TOU Tiers
        INSERT INTO time_of_use_tiers (tariff_plan_id, tier_name, start_time, end_time, energy_rate_per_kwh, description)
        VALUES
            (ind_plan_id, 'Off-Peak Valley (Charging)', '22:00:00', '05:00:00', 3.6000, 'Industrial overnight bulk charging concession'),
            (ind_plan_id, 'Standard Normal Shift', '05:00:00', '17:00:00', 7.8000, 'Commercial manufacturing daylight shift tariff'),
            (ind_plan_id, 'Super-Peak Stress (Discharging)', '17:00:00', '22:00:00', 13.8000, 'Industrial peak demand penalty window');

        -- Industrial Peak Demand Charges
        INSERT INTO peak_demand_charges (tariff_plan_id, demand_charge_per_kw_month, contracted_demand_kw, ratchet_percentage)
        VALUES
            (ind_plan_id, 520.00, 650.00, 85.00);

        -- Industrial Feed-in Tariffs
        INSERT INTO utility_feed_in_rates (tariff_plan_id, export_rate_per_kwh, export_mechanism, max_export_capacity_kw)
        VALUES
            (ind_plan_id, 4.5000, 'GROSS_PPA', 2500.00);
    END IF;
END $$;

-- Seed initial representative monthly billing ledger statement
DO $$
DECLARE
    comm_plan_id UUID;
    ledger_id UUID;
BEGIN
    SELECT id INTO comm_plan_id FROM tariff_plans WHERE code = 'COMM-HT-01' LIMIT 1;
    
    IF comm_plan_id IS NOT NULL THEN
        INSERT INTO billing_ledgers (
            statement_number,
            substation_id,
            tariff_plan_id,
            billing_period_start,
            billing_period_end,
            total_imported_kwh,
            total_exported_kwh,
            off_peak_imported_kwh,
            normal_imported_kwh,
            super_peak_imported_kwh,
            ess_displaced_peak_kwh,
            recorded_peak_demand_kw,
            shaved_peak_demand_kw,
            billed_demand_kw,
            gross_energy_cost,
            demand_surcharge_cost,
            export_feed_in_credit,
            net_utility_bill,
            baseline_flat_tariff_cost,
            unmitigated_tou_cost,
            arbitrage_revenue,
            peak_shaving_savings,
            net_money_saved,
            settlement_status
        ) VALUES (
            'GV-STMT-2026-10',
            'SUB-400KV-NORTH-01',
            comm_plan_id,
            '2026-10-01 00:00:00+05:30',
            '2026-10-31 23:59:59+05:30',
            180000.0000,  -- 180 MWh total imported
            45000.0000,   -- 45 MWh clean discharged
            63000.0000,   -- 35% off-peak valley charging
            59400.0000,   -- 33% normal shift
            57600.0000,   -- 32% peak
            42000.0000,   -- 42 MWh battery peak displaced
            520.00,       -- 520 kW unmanaged peak
            380.00,       -- 380 kW shaved by GridVault ESS
            140.00,       -- 140 kW remaining billed peak demand
            1185000.00,   -- Gross energy cost
            63000.00,     -- Billed demand charges (140 kW * ₹450)
            191250.00,    -- Export credits
            1056750.00,   -- Net utility bill
            1764000.00,   -- Baseline flat tariff cost (without ESS)
            1998000.00,   -- Unmitigated TOU cost (without ESS)
            182400.00,    -- Arbitrage savings
            160400.00,    -- Peak demand savings (380 kW * ₹450 - standby)
            342800.00,    -- Total net savings (matches ExecutiveSummary ₹3,42,800)
            'SETTLED'
        )
        RETURNING id INTO ledger_id;

        -- Add initial sample transaction ledger entries
        IF ledger_id IS NOT NULL THEN
            INSERT INTO transaction_ledgers (
                billing_ledger_id,
                substation_id,
                transaction_timestamp,
                transaction_type,
                tariff_tier_name,
                energy_kwh,
                unit_rate,
                total_amount,
                cumulative_balance,
                verification_hash,
                notes
            ) VALUES
                (ledger_id, 'SUB-400KV-NORTH-01', '2026-10-22 03:30:00+05:30', 'VALLEY_CHARGING_BUY', 'Off-Peak Valley (Charging)', 14800.0000, 3.8000, 56240.00, -56240.00, encode(digest('GV-TX-001-VALLEY-BUY', 'sha256'), 'hex'), 'Overnight automated battery pack replenishment from renewable wind'),
                (ledger_id, 'SUB-400KV-NORTH-01', '2026-10-22 19:15:00+05:30', 'PEAK_DISCHARGE_DISPLACE', 'Super-Peak Stress (Discharging)', 13616.0000, 12.5000, 170200.00, 113960.00, encode(digest('GV-TX-002-PEAK-DISPLACE', 'sha256'), 'hex'), 'Evening peak arbitrage discharge displacing grid purchase at 12.50 INR/kWh'),
                (ledger_id, 'SUB-400KV-NORTH-01', '2026-10-22 20:00:00+05:30', 'DEMAND_SHAVING_OFFSET', 'Super-Peak Stress (Discharging)', 420.0000, 450.0000, 189000.00, 302960.00, encode(digest('GV-TX-003-DEMAND-SHAVE', 'sha256'), 'hex'), 'Substation feeder demand charge reduction (420 kW shaved under contracted cap)');
        END IF;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 9. ANALYTICAL VIEWS
-- Convenience views for reporting and dashboard aggregation queries.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW view_tariff_savings_summary AS
SELECT
    bl.statement_number,
    bl.substation_id,
    tp.name AS tariff_plan_name,
    tp.code AS tariff_plan_code,
    bl.billing_period_start,
    bl.billing_period_end,
    bl.total_imported_kwh,
    bl.total_exported_kwh,
    bl.recorded_peak_demand_kw,
    bl.shaved_peak_demand_kw,
    bl.net_utility_bill,
    bl.baseline_flat_tariff_cost,
    bl.net_money_saved,
    ROUND(((bl.net_money_saved / NULLIF(bl.baseline_flat_tariff_cost, 0)) * 100), 2) AS savings_percentage_vs_flat,
    bl.settlement_status
FROM billing_ledgers bl
JOIN tariff_plans tp ON bl.tariff_plan_id = tp.id;
