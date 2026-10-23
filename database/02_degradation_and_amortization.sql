-- ==============================================================================
-- GridVault ESS Database Schema Migration
-- Module: Analytics & Financial Ledger (Varad Bhardwaj)
-- Component: IRRandLCOSCard
-- Milestone: Oct 23, 2026 16:15:00 +0530
-- Commit: schema(IRRandLCOSCard): create degradation cost and asset amortization tables
-- Description: Create database tables to model battery cell degradation costs
--              per kWh cycled, equipment depreciation schedules, and salvage value.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. BATTERY DEGRADATION MODELS
-- Mathematical and physical wear parameters per battery rack/cell chemistry.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS battery_degradation_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_code VARCHAR(50) UNIQUE NOT NULL,
    chemistry VARCHAR(50) NOT NULL DEFAULT 'LFP', -- 'LFP' (LiFePO4), 'NMC', 'SODIUM_ION'
    nominal_pack_capacity_kwh NUMERIC(10, 2) NOT NULL DEFAULT 14800.00, -- 14.8 MWh container
    warranted_cycle_life INT NOT NULL DEFAULT 6000, -- 6000 cycles to 80% SOH
    calendar_life_years INT NOT NULL DEFAULT 15,
    round_trip_efficiency_pct NUMERIC(5, 2) NOT NULL DEFAULT 92.00, -- 92% RTE
    
    -- Degradation Cost Coefficients
    base_wear_cost_per_kwh_cycled NUMERIC(10, 4) NOT NULL DEFAULT 0.6500, -- ₹0.6500 / kWh throughput
    c_rate_acceleration_factor NUMERIC(6, 4) NOT NULL DEFAULT 0.1250, -- Wear scaling under high C-rates (>0.5C)
    temperature_penalty_per_deg_c NUMERIC(6, 4) NOT NULL DEFAULT 0.0350, -- Degradation acceleration above 30°C
    cell_replacement_cost_per_kwh NUMERIC(10, 2) NOT NULL DEFAULT 9500.00, -- Future replacement cell cost (₹/kWh)
    end_of_life_soh_threshold_pct NUMERIC(5, 2) NOT NULL DEFAULT 70.00, -- 70% SOH retirement limit
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. CYCLE DEGRADATION LOGS
-- Operational tracking records logging cumulative cycle wear and cost.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cycle_degradation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    degradation_model_id UUID NOT NULL REFERENCES battery_degradation_models(id),
    substation_id VARCHAR(50) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Operational Metrics
    cumulative_cycles NUMERIC(10, 2) NOT NULL,
    depth_of_discharge_pct NUMERIC(5, 2) NOT NULL,
    pack_avg_temp_celsius NUMERIC(5, 2) NOT NULL,
    active_c_rate NUMERIC(4, 2) NOT NULL,
    throughput_energy_kwh NUMERIC(12, 4) NOT NULL,
    
    -- Health & Degradation State
    state_of_health_pct NUMERIC(5, 2) NOT NULL, -- Starts at 100%, decays over time
    cumulative_capacity_loss_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    incremental_cycle_wear_cost NUMERIC(10, 2) NOT NULL, -- ₹ wear cost incurred in this session
    cumulative_wear_cost_incurred NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. ASSET AMORTIZATION SCHEDULES
-- Equipment capital depreciation and book value schedules over asset lifespan.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asset_amortization_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag VARCHAR(50) UNIQUE NOT NULL,
    asset_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'BATTERY_STORAGE', 'INVERTER_PCS', 'HVAC_THERMAL', 'BALANCE_OF_PLANT'
    substation_id VARCHAR(50) NOT NULL,
    commissioning_date DATE NOT NULL DEFAULT '2025-09-01',
    useful_life_years INT NOT NULL DEFAULT 10,
    
    -- Valuation & Capex
    turnkey_initial_cost NUMERIC(14, 2) NOT NULL, -- Initial turnkey capital expenditure
    salvage_value_pct NUMERIC(5, 2) NOT NULL DEFAULT 10.00, -- Residual salvage value percentage (10%)
    salvage_value_amount NUMERIC(14, 2) NOT NULL, -- Guaranteed salvage / scrap recovery value
    depreciable_base_amount NUMERIC(14, 2) NOT NULL, -- Initial Cost minus Salvage Value
    depreciation_method VARCHAR(30) NOT NULL DEFAULT 'STRAIGHT_LINE', -- 'STRAIGHT_LINE', 'MACRS', 'UNITS_OF_PRODUCTION'
    
    -- Annual Ledger Schedule
    annual_depreciation_expense NUMERIC(14, 2) NOT NULL,
    accumulated_depreciation NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    current_net_book_value NUMERIC(14, 2) NOT NULL,
    last_depreciation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. LCOS BENCHMARK INDICES
-- Levelized Cost of Storage metrics factoring capital, wear, and efficiency.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lcos_benchmark_indices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_schedule_id UUID NOT NULL REFERENCES asset_amortization_schedules(id) ON DELETE CASCADE,
    benchmark_year INT NOT NULL,
    projected_discount_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 8.50, -- 8.5% WACC discount rate
    lifetime_throughput_mwh NUMERIC(12, 2) NOT NULL,
    total_lifetime_capex NUMERIC(14, 2) NOT NULL,
    total_lifetime_opex NUMERIC(14, 2) NOT NULL,
    total_degradation_cost NUMERIC(14, 2) NOT NULL,
    calculated_lcos_per_kwh NUMERIC(8, 4) NOT NULL DEFAULT 4.1200, -- ₹4.12 / kWh benchmark LCOS
    projected_internal_rate_of_return NUMERIC(5, 2) NOT NULL DEFAULT 18.40, -- 18.4% IRR
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_degradation_logs_model ON cycle_degradation_logs(degradation_model_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_degradation_logs_substation ON cycle_degradation_logs(substation_id);
CREATE INDEX IF NOT EXISTS idx_asset_amortization_substation ON asset_amortization_schedules(substation_id);
CREATE INDEX IF NOT EXISTS idx_lcos_benchmark_year ON lcos_benchmark_indices(benchmark_year);

-- ------------------------------------------------------------------------------
-- 6. SEED DATA
-- Baseline LFP degradation model and asset amortization schedules.
-- ------------------------------------------------------------------------------
INSERT INTO battery_degradation_models (
    model_code,
    chemistry,
    nominal_pack_capacity_kwh,
    warranted_cycle_life,
    calendar_life_years,
    round_trip_efficiency_pct,
    base_wear_cost_per_kwh_cycled,
    c_rate_acceleration_factor,
    cell_replacement_cost_per_kwh
) VALUES (
    'GRIDVAULT-LFP-14.8MWH',
    'LFP',
    14800.00,
    6000,
    15,
    92.00,
    0.6500, -- ₹0.65 / kWh cycled wear cost
    0.1250,
    9500.00
) ON CONFLICT (model_code) DO NOTHING;

-- Seed asset amortization items for turnkey 14.8MWh GridVault installation (Total Capex: ₹2,50,00,000)
INSERT INTO asset_amortization_schedules (
    asset_tag,
    asset_name,
    category,
    substation_id,
    commissioning_date,
    useful_life_years,
    turnkey_initial_cost,
    salvage_value_pct,
    salvage_value_amount,
    depreciable_base_amount,
    annual_depreciation_expense,
    accumulated_depreciation,
    current_net_book_value
) VALUES
    ('AST-BATT-01', '14.8 MWh Containerized LFP Battery Racks', 'BATTERY_STORAGE', 'SUB-400KV-NORTH-01', '2025-09-01', 10, 14500000.00, 10.00, 1450000.00, 13050000.00, 1305000.00, 1522500.00, 12977500.00),
    ('AST-PCS-02', '5.0 MW Bi-Directional Grid-Forming Inverter (PCS)', 'INVERTER_PCS', 'SUB-400KV-NORTH-01', '2025-09-01', 10, 4500000.00, 10.00, 450000.00, 4050000.00, 405000.00, 472500.00, 4027500.00),
    ('AST-BOP-03', 'Balance of Plant: Liquid Cooling, Fire Suppression, Switchgear', 'BALANCE_OF_PLANT', 'SUB-400KV-NORTH-01', '2025-09-01', 10, 3200000.00, 10.00, 320000.00, 2880000.00, 288000.00, 336000.00, 2864000.00),
    ('AST-SCADA-04', 'High-Speed SCADA & Telemetry Grid Gateway', 'BALANCE_OF_PLANT', 'SUB-400KV-NORTH-01', '2025-09-01', 10, 1800000.00, 10.00, 180000.00, 1620000.00, 162000.00, 189000.00, 1611000.00),
    ('AST-CIVIL-05', 'Civil Foundation & Substation Interconnect Works', 'BALANCE_OF_PLANT', 'SUB-400KV-NORTH-01', '2025-09-01', 15, 1000000.00, 0.00, 0.00, 1000000.00, 66667.00, 77778.00, 922222.00)
ON CONFLICT (asset_tag) DO NOTHING;

-- Seed LCOS Benchmark matching the IRRandLCOSCard (LCOS: ₹4.12 / kWh, IRR: 18.4%)
DO $$
DECLARE
    batt_asset_id UUID;
BEGIN
    SELECT id INTO batt_asset_id FROM asset_amortization_schedules WHERE asset_tag = 'AST-BATT-01' LIMIT 1;
    IF batt_asset_id IS NOT NULL THEN
        INSERT INTO lcos_benchmark_indices (
            asset_schedule_id,
            benchmark_year,
            projected_discount_rate_pct,
            lifetime_throughput_mwh,
            total_lifetime_capex,
            total_lifetime_opex,
            total_degradation_cost,
            calculated_lcos_per_kwh,
            projected_internal_rate_of_return
        ) VALUES (
            batt_asset_id,
            2026,
            8.50,
            88800.00, -- 14.8 MWh * 6000 cycles
            25000000.00, -- ₹2.5 Crore Turnkey Capex
            7800000.00,  -- Lifetime scheduled Opex
            5772000.00,  -- ₹0.65/kWh cycled degradation
            4.1200,      -- Matches IRRandLCOSCard: ₹4.12 / kWh LCOS
            18.40        -- Matches IRRandLCOSCard: 18.4% Cumulative IRR
        );
    END IF;
END $$;
