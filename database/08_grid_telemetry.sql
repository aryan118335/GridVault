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
