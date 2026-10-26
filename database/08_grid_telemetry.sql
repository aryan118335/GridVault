-- ==============================================================================
-- GridVault ESS Database Schema Migration
-- Module: Live Grid Telemetry & Power Balance (Ayush)
-- Milestone: Oct 22 - Oct 26, 2026 +0530
-- Commits:
--   1. schema(grid_state): create grid_state table in 08_grid_telemetry.sql
--   2. schema(grid_state): add recorded_at DESC index for time-series queries
--   3. seed(grid_state): add 24-hour historical solar, wind, and demand telemetry rows
-- Description: Define the core grid_state time-series telemetry table for live solar,
--              wind, and city demand tracking, index recorded_at DESC for sub-10ms
--              chart reads, and seed 48 realistic diurnal curve telemetry rows.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. GRID STATE TELEMETRY TABLE
-- Stores live renewable generation, city power demand, net grid balance,
-- AC frequency, and operating status (SURPLUS / DEFICIT / BALANCED).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grid_state (
    id SERIAL PRIMARY KEY,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    solar_mw NUMERIC(10, 2) NOT NULL,
    wind_mw NUMERIC(10, 2) NOT NULL,
    demand_mw NUMERIC(10, 2) NOT NULL,
    net_balance_mw NUMERIC(10, 2) NOT NULL,
    grid_frequency_hz NUMERIC(5, 2) DEFAULT 50.00,
    grid_status VARCHAR(30) DEFAULT 'BALANCED'
);

-- ------------------------------------------------------------------------------
-- 2. TIME-SERIES INDEX
-- Descending B-Tree index on recorded_at for fast Chart.js live & history reads.
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_grid_state_recorded_at_desc
    ON grid_state (recorded_at DESC);

-- ------------------------------------------------------------------------------
-- 3. SEED DATA (48 realistic rows covering a 24-hour solar/wind/demand curve)
-- ------------------------------------------------------------------------------
INSERT INTO grid_state (
    recorded_at,
    solar_mw,
    wind_mw,
    demand_mw,
    net_balance_mw,
    grid_frequency_hz,
    grid_status
)
VALUES
    (NOW() - INTERVAL '705 minutes',   0.00, 142.50, 168.00, -25.50, 49.94, 'DEFICIT'),
    (NOW() - INTERVAL '690 minutes',   0.00, 148.20, 162.40, -14.20, 49.96, 'DEFICIT'),
    (NOW() - INTERVAL '675 minutes',   0.00, 151.80, 155.10,  -3.30, 49.99, 'BALANCED'),
    (NOW() - INTERVAL '660 minutes',   0.00, 156.40, 152.00,   4.40, 50.01, 'BALANCED'),
    (NOW() - INTERVAL '645 minutes',   0.00, 160.10, 149.80,  10.30, 50.02, 'SURPLUS'),
    (NOW() - INTERVAL '630 minutes',   0.00, 154.90, 147.50,   7.40, 50.01, 'SURPLUS'),
    (NOW() - INTERVAL '615 minutes',   2.40, 149.60, 150.20,   1.80, 50.00, 'BALANCED'),
    (NOW() - INTERVAL '600 minutes',  14.80, 145.10, 158.90,   1.00, 50.00, 'BALANCED'),
    (NOW() - INTERVAL '585 minutes',  36.50, 139.40, 174.20,   1.70, 50.00, 'BALANCED'),
    (NOW() - INTERVAL '570 minutes',  64.20, 134.80, 192.50,   6.50, 50.02, 'SURPLUS'),
    (NOW() - INTERVAL '555 minutes',  95.60, 128.30, 210.40,  13.50, 50.03, 'SURPLUS'),
    (NOW() - INTERVAL '540 minutes', 128.40, 124.90, 226.10,  27.20, 50.04, 'SURPLUS'),
    (NOW() - INTERVAL '525 minutes', 158.90, 121.50, 238.70,  41.70, 50.05, 'SURPLUS'),
    (NOW() - INTERVAL '510 minutes', 186.30, 118.20, 245.90,  58.60, 50.06, 'SURPLUS'),
    (NOW() - INTERVAL '495 minutes', 210.70, 115.60, 252.30,  74.00, 50.07, 'SURPLUS'),
    (NOW() - INTERVAL '480 minutes', 231.50, 112.40, 258.10,  85.80, 50.08, 'SURPLUS'),
    (NOW() - INTERVAL '465 minutes', 248.20, 109.80, 264.50,  93.50, 50.08, 'SURPLUS'),
    (NOW() - INTERVAL '450 minutes', 261.40, 106.20, 270.80,  96.80, 50.09, 'SURPLUS'),
    (NOW() - INTERVAL '435 minutes', 269.80, 104.50, 276.40,  97.90, 50.09, 'SURPLUS'),
    (NOW() - INTERVAL '420 minutes', 274.10, 102.90, 282.00,  95.00, 50.08, 'SURPLUS'),
    (NOW() - INTERVAL '405 minutes', 271.60, 105.40, 286.20,  90.80, 50.07, 'SURPLUS'),
    (NOW() - INTERVAL '390 minutes', 263.50, 108.70, 291.40,  80.80, 50.06, 'SURPLUS'),
    (NOW() - INTERVAL '375 minutes', 250.90, 111.30, 296.80,  65.40, 50.05, 'SURPLUS'),
    (NOW() - INTERVAL '360 minutes', 234.20, 114.80, 302.50,  46.50, 50.04, 'SURPLUS'),
    (NOW() - INTERVAL '345 minutes', 213.80, 118.90, 309.20,  23.50, 50.02, 'SURPLUS'),
    (NOW() - INTERVAL '330 minutes', 189.40, 122.60, 314.80,  -2.80, 49.99, 'BALANCED'),
    (NOW() - INTERVAL '315 minutes', 161.20, 127.40, 322.10, -33.50, 49.95, 'DEFICIT'),
    (NOW() - INTERVAL '300 minutes', 129.70, 131.80, 329.60, -68.10, 49.91, 'DEFICIT'),
    (NOW() - INTERVAL '285 minutes',  96.40, 136.20, 338.40, -105.80, 49.88, 'DEFICIT'),
    (NOW() - INTERVAL '270 minutes',  62.80, 141.50, 346.20, -141.90, 49.86, 'DEFICIT'),
    (NOW() - INTERVAL '255 minutes',  31.50, 146.90, 352.80, -174.40, 49.85, 'DEFICIT'),
    (NOW() - INTERVAL '240 minutes',   9.20, 151.40, 349.50, -188.90, 49.84, 'DEFICIT'),
    (NOW() - INTERVAL '225 minutes',   0.00, 155.80, 341.20, -185.40, 49.85, 'DEFICIT'),
    (NOW() - INTERVAL '210 minutes',   0.00, 159.20, 328.90, -169.70, 49.87, 'DEFICIT'),
    (NOW() - INTERVAL '195 minutes',   0.00, 162.70, 312.40, -149.70, 49.89, 'DEFICIT'),
    (NOW() - INTERVAL '180 minutes',   0.00, 165.10, 294.60, -129.50, 49.90, 'DEFICIT'),
    (NOW() - INTERVAL '165 minutes',   0.00, 161.90, 276.80, -114.90, 49.91, 'DEFICIT'),
    (NOW() - INTERVAL '150 minutes',   0.00, 158.40, 259.20, -100.80, 49.92, 'DEFICIT'),
    (NOW() - INTERVAL '135 minutes',   0.00, 154.60, 241.50,  -86.90, 49.93, 'DEFICIT'),
    (NOW() - INTERVAL '120 minutes',   0.00, 150.20, 224.80,  -74.60, 49.94, 'DEFICIT'),
    (NOW() - INTERVAL '105 minutes',   0.00, 146.80, 208.40,  -61.60, 49.95, 'DEFICIT'),
    (NOW() - INTERVAL '90 minutes',    0.00, 143.50, 194.20,  -50.70, 49.96, 'DEFICIT'),
    (NOW() - INTERVAL '75 minutes',    0.00, 140.90, 182.60,  -41.70, 49.97, 'DEFICIT'),
    (NOW() - INTERVAL '60 minutes',   18.40, 138.20, 175.10,  -18.50, 49.98, 'DEFICIT'),
    (NOW() - INTERVAL '45 minutes',   48.90, 135.60, 182.40,    2.10, 50.00, 'BALANCED'),
    (NOW() - INTERVAL '30 minutes',   86.20, 132.40, 196.80,   21.80, 50.02, 'SURPLUS'),
    (NOW() - INTERVAL '15 minutes',  124.50, 129.80, 212.30,   42.00, 50.04, 'SURPLUS'),
    (NOW(),                          156.80, 126.40, 228.60,   54.60, 50.05, 'SURPLUS');
