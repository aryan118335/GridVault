-- ==============================================================================
-- GridVault ESS Database Schema Migration
-- Module: Battery Storage & Real-Time Dispatch Engine (Varad Bhardwaj)
-- Milestone: Nov 22, 2026 21:05:00 +0530
-- Commit: schema(battery): create battery_status and dispatch_logs tables
-- Description: Define core relational entities for real-time battery storage state
--              (SOC percentage, capacity, operating mode) and dispatch action audit logs.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. BATTERY STATUS
-- Live operational telemetry and state of charge for the BESS installation.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS battery_status (
    id SERIAL PRIMARY KEY,
    charge_percent NUMERIC(5, 2) NOT NULL DEFAULT 75.00,
    max_capacity_mw NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    mode VARCHAR(20) NOT NULL DEFAULT 'STANDBY',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. DISPATCH LOGS
-- Audit trail of dispatch decisions made by the real-time arbitrage/control algorithm.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dispatch_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(30) NOT NULL,
    power_mw NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. SEED DATA
-- Baseline state of charge and initial algorithm dispatch decisions.
-- ------------------------------------------------------------------------------
INSERT INTO battery_status (charge_percent, max_capacity_mw, mode)
VALUES (75.00, 100.00, 'STANDBY');

INSERT INTO dispatch_logs (action, power_mw, reason)
VALUES
    ('CHARGE', 25.50, 'Excess solar generation absorption during off-peak'),
    ('DISCHARGE', 40.00, 'Peak demand reduction during high tariff period'),
    ('STANDBY', 0.00, 'Grid frequency stabilization within nominal bounds');
