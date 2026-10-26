-- ==============================================================================
-- GridVault ESS Database Schema Migration
-- Module: Analytics & Financial Ledger (Varad Bhardwaj)
-- Component: ExecutiveSummary
-- Milestone: Oct 26, 2026 14:00:00 +0530
-- Commit: schema(ExecutiveSummary): define ROI baseline metrics and capital expenditure models
-- Description: Create schema entities for initial Capex, Opex maintenance contracts,
--              discount rates, and payback benchmark milestones.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CAPEX EXPENDITURE ITEMS
-- Detailed capital expenditure breakdown of initial turnkey GridVault ESS investment.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS capex_expenditure_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code VARCHAR(50) UNIQUE NOT NULL,
    substation_id VARCHAR(50) NOT NULL DEFAULT 'SUB-400KV-NORTH-01',
    category VARCHAR(50) NOT NULL, -- 'BATTERY_STORAGE', 'PCS_INVERTERS', 'BALANCE_OF_PLANT', 'SCADA_TELEMETRY', 'EPC_CIVIL'
    description VARCHAR(200) NOT NULL,
    vendor VARCHAR(100) NOT NULL,
    unit_cost NUMERIC(14, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_capex_amount NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    commissioning_date DATE NOT NULL DEFAULT '2025-09-01',
    warranty_period_months INT NOT NULL DEFAULT 120, -- 10-year warranty
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. OPEX MAINTENANCE CONTRACTS
-- Annual recurring maintenance, warranty extensions, and cell augmentation budgets.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opex_maintenance_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    substation_id VARCHAR(50) NOT NULL DEFAULT 'SUB-400KV-NORTH-01',
    contractor_name VARCHAR(150) NOT NULL,
    contract_type VARCHAR(50) NOT NULL, -- 'ANNUAL_MAINTENANCE_AMC', 'AUGMENTATION_RESERVE', 'GRID_INSURANCE'
    annual_cost NUMERIC(14, 2) NOT NULL,
    payment_interval VARCHAR(20) NOT NULL DEFAULT 'ANNUAL',
    start_date DATE NOT NULL DEFAULT '2025-09-01',
    end_date DATE NOT NULL DEFAULT '2035-08-31',
    sla_response_time_hours INT NOT NULL DEFAULT 4,
    guaranteed_availability_pct NUMERIC(5, 2) NOT NULL DEFAULT 98.50, -- 98.5% uptime SLA
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. ROI FINANCIAL MODELS
-- Master financial model parameters for NPV, WACC, discount rate, and IRR.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roi_financial_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) UNIQUE NOT NULL,
    substation_id VARCHAR(50) NOT NULL DEFAULT 'SUB-400KV-NORTH-01',
    turnkey_capex_total NUMERIC(14, 2) NOT NULL DEFAULT 25000000.00, -- ₹2.5 Crore baseline Capex
    annual_opex_total NUMERIC(14, 2) NOT NULL DEFAULT 780000.00, -- ₹7.8L annual operational expense
    wacc_discount_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 8.50, -- 8.5% cost of capital
    project_lifetime_years INT NOT NULL DEFAULT 10,
    cumulative_net_present_value NUMERIC(14, 2) NOT NULL DEFAULT 18450000.00, -- Projected 10Y NPV
    internal_rate_of_return_pct NUMERIC(5, 2) NOT NULL DEFAULT 18.40, -- 18.4% IRR
    breakeven_target_months INT NOT NULL DEFAULT 45, -- 3.8 Years breakeven
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. PAYBACK BENCHMARK MILESTONES
-- Inflection point milestones matching PaybackCurveChart.jsx and ExecutiveSummary.jsx.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payback_benchmark_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES roi_financial_models(id) ON DELETE CASCADE,
    milestone_code VARCHAR(50) UNIQUE NOT NULL,
    milestone_name VARCHAR(150) NOT NULL,
    elapsed_months INT NOT NULL,
    target_year NUMERIC(4, 1) NOT NULL,
    initial_capex_deficit NUMERIC(14, 2) NOT NULL DEFAULT -25000000.00,
    cumulative_cash_inflow NUMERIC(14, 2) NOT NULL,
    net_profit_or_deficit NUMERIC(14, 2) NOT NULL,
    recovery_percentage NUMERIC(5, 2) NOT NULL,
    is_inflection_point BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_capex_category ON capex_expenditure_items(category);
CREATE INDEX IF NOT EXISTS idx_opex_substation ON opex_maintenance_contracts(substation_id);
CREATE INDEX IF NOT EXISTS idx_payback_milestones_month ON payback_benchmark_milestones(elapsed_months);

-- ------------------------------------------------------------------------------
-- 6. SEED DATA
-- Capex line items totaling ₹2,50,00,000 + 5-year payback trajectory milestones.
-- ------------------------------------------------------------------------------
INSERT INTO capex_expenditure_items (item_code, category, description, vendor, unit_cost, quantity, total_capex_amount)
VALUES
    ('CPX-BATT-14.8M', 'BATTERY_STORAGE', '14.8 MWh Containerized Tier-1 LFP Battery Racks & BMS', 'CATL / Contemporary Clean Energy', 14500000.00, 1, 14500000.00),
    ('CPX-PCS-5MW', 'PCS_INVERTERS', '5.0 MW Central Bi-Directional Grid-Forming Inverters', 'Sungrow Power Supply', 4500000.00, 1, 4500000.00),
    ('CPX-BOP-HVAC', 'BALANCE_OF_PLANT', 'Containerized Liquid Cooling, Novec Fire Suppression & Switchgear', 'Schneider Electric Infrastructure', 3200000.00, 1, 3200000.00),
    ('CPX-SCADA-01', 'SCADA_TELEMETRY', 'Deterministic Edge RTU Gateway & Sub-Second Metering Unit', 'Siemens Energy Substation Automation', 1800000.00, 1, 1800000.00),
    ('CPX-CIVIL-01', 'EPC_CIVIL', 'Civil Foundation, Earthworks & High-Voltage Interconnection Works', 'L&T Power Transmission EPC', 1000000.00, 1, 1000000.00)
ON CONFLICT (item_code) DO NOTHING;

-- Seed Opex maintenance contracts
INSERT INTO opex_maintenance_contracts (contract_number, contractor_name, contract_type, annual_cost, guaranteed_availability_pct)
VALUES
    ('OPX-AMC-2025-01', 'GridVault Field Operations Team', 'ANNUAL_MAINTENANCE_AMC', 420000.00, 99.20),
    ('OPX-AUG-2025-02', 'LFP Battery Cell Augmentation Reserve', 'AUGMENTATION_RESERVE', 240000.00, 99.80),
    ('OPX-INS-2025-03', 'National Grid Infrastructure All-Risk Insurance', 'GRID_INSURANCE', 120000.00, 100.00)
ON CONFLICT (contract_number) DO NOTHING;

-- Seed ROI Financial Model
INSERT INTO roi_financial_models (
    model_name,
    turnkey_capex_total,
    annual_opex_total,
    wacc_discount_rate_pct,
    project_lifetime_years,
    cumulative_net_present_value,
    internal_rate_of_return_pct,
    breakeven_target_months
) VALUES (
    'GRIDVAULT-14.8MWH-FINANCIAL-BASELINE',
    25000000.00, -- ₹2.5 Crore initial Capex
    780000.00,
    8.50,
    10,
    18450000.00,
    18.40, -- 18.4% IRR
    45     -- Month 45 (3.8 Years) breakeven
) ON CONFLICT (model_name) DO NOTHING;

-- Seed Payback Benchmark Milestones matching PaybackCurveChart.jsx
DO $$
DECLARE
    m_id UUID;
BEGIN
    SELECT id INTO m_id FROM roi_financial_models WHERE model_name = 'GRIDVAULT-14.8MWH-FINANCIAL-BASELINE' LIMIT 1;

    IF m_id IS NOT NULL THEN
        INSERT INTO payback_benchmark_milestones (
            model_id,
            milestone_code,
            milestone_name,
            elapsed_months,
            target_year,
            cumulative_cash_inflow,
            net_profit_or_deficit,
            recovery_percentage,
            is_inflection_point,
            notes
        ) VALUES
            (m_id, 'M00-COMMISSION', 'Day 0 System Turnkey Commissioning', 0, 0.0, 0.00, -25000000.00, 0.00, FALSE, 'Turnkey initial investment fully deployed'),
            (m_id, 'M12-YEAR-1', 'Year 1.0 Milestone Operation', 12, 1.0, 7100000.00, -17900000.00, 28.40, FALSE, 'First year full cycle arbitrage and peak shaving'),
            (m_id, 'M14-CURRENT', 'Month 14 Current Operational Benchmark', 14, 1.2, 8240000.00, -16760000.00, 33.00, FALSE, 'Matches PaybackCurveChart: ₹82.4L (33.0%) recovered so far'),
            (m_id, 'M24-YEAR-2', 'Year 2.0 Milestone Operation', 24, 2.0, 13950000.00, -11050000.00, 55.80, FALSE, '55.8% capital recovery reached'),
            (m_id, 'M36-YEAR-3', 'Year 3.0 Horizon Review', 36, 3.0, 20450000.00, -4550000.00, 81.80, FALSE, 'Approaching breakeven inflection threshold'),
            (m_id, 'M45-BREAKEVEN', 'Breakeven Payback Inflection Point', 45, 3.8, 25000000.00, 0.00, 100.00, TRUE, 'Inflection Point: Capex fully paid off at Year 3.8 (Month 45)'),
            (m_id, 'M60-YEAR-5', '5-Year Cumulative Horizon (Net Profit)', 60, 5.0, 33500000.00, 8500000.00, 134.00, FALSE, 'Net positive ROI profit of +₹85.0L beyond initial Capex')
        ON CONFLICT (milestone_code) DO NOTHING;
    END IF;
END $$;
