-- ==============================================================================
-- GridVault ESS Database Schema Migration
-- Module: Operator Authentication, RBAC & Ownership Isolation (Ayush)
-- Description: Defines grid_operators (bcrypt cost-12 password hashes & RBAC roles),
--              operator_refresh_tokens (revocation-backed HttpOnly refresh sessions),
--              and operator_watchlists (user-owned resources for IDOR protection).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS grid_operators (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'VIEWER'
        CHECK (role IN ('ADMIN', 'OPERATOR', 'VIEWER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operator_refresh_tokens (
    id SERIAL PRIMARY KEY,
    operator_id INTEGER NOT NULL REFERENCES grid_operators(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_operator_active
    ON operator_refresh_tokens (operator_id, revoked, expires_at);

CREATE TABLE IF NOT EXISTS operator_watchlists (
    id SERIAL PRIMARY KEY,
    operator_id INTEGER NOT NULL REFERENCES grid_operators(id) ON DELETE CASCADE,
    label VARCHAR(120) NOT NULL,
    alert_threshold_mw NUMERIC(10, 2) NOT NULL CHECK (alert_threshold_mw > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watchlists_operator
    ON operator_watchlists (operator_id);

-- Seed 3 RBAC operator accounts with bcryptjs (cost 12) salted password hashes
INSERT INTO grid_operators (email, full_name, password_hash, role)
VALUES
    (
        'admin@gridvault.io',
        'Aryan Deshmukh (Grid Admin)',
        '$2b$12$Wi8rYsS5nhB/B6xE6p7yaeKEgKnYRMhImDEi0Vz04eFt/BK9Q4VP2',
        'ADMIN'
    ),
    (
        'operator@gridvault.io',
        'Ayush Vijay (Shift Operator)',
        '$2b$12$/UIKpspRMosVKXvJ26Jjr.l9u5RylCxmUjzgu4Yv5u393EAzh0c4W',
        'OPERATOR'
    ),
    (
        'viewer@gridvault.io',
        'Grid Compliance Viewer',
        '$2b$12$jrktGVfYXCqUrYwzHJxkdu5V/E2C99.AXHImc7bvy.m/7JyrG0NPO',
        'VIEWER'
    )
ON CONFLICT (email) DO NOTHING;

-- Seed per-operator watchlists (idempotent) to verify cross-user ownership checks
INSERT INTO operator_watchlists (operator_id, label, alert_threshold_mw)
SELECT o.id, v.label, v.threshold
FROM (VALUES
    ('operator@gridvault.io', 'Evening Peak Demand Watchlist', 260.00),
    ('viewer@gridvault.io', 'Compliance Reserve Monitor', 210.00)
) AS v(email, label, threshold)
JOIN grid_operators o ON o.email = v.email
WHERE NOT EXISTS (
    SELECT 1 FROM operator_watchlists w WHERE w.operator_id = o.id AND w.label = v.label
);
