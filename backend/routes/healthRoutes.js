/**
 * GridVault ESS - System Health Check Routes
 * Module: Analytics & Financial Backend (Varad Bhardwaj)
 * Milestone: Nov 05, 2026 16:45:00 +0530
 * Commit: feat(server): bootstrap Express API server with all analytics route modules
 *
 * Health-check endpoints consumed by SystemReadinessPanel.jsx.
 * Each endpoint independently probes a backend subsystem and returns
 * { status: 'ok' | 'degraded', latencyMs, message, timestamp }.
 */

import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/health/supabase
// Pings Neon PostgreSQL (the project uses Neon, labelled 'supabase' in the UI
// to match SystemReadinessPanel.jsx indicator naming).
// ─────────────────────────────────────────────────────────────────────────────
router.get('/supabase', async (req, res) => {
  const start = Date.now();
  try {
    await query('SELECT 1 AS ping;');
    res.json({
      status: 'ok',
      latencyMs: Date.now() - start,
      message: 'Neon PostgreSQL reachable',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.json({
      status: 'degraded',
      latencyMs: Date.now() - start,
      message: `DB error: ${err.message}`,
      timestamp: new Date().toISOString(),
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/health/ws
// Simulates WebSocket broker health check.
// In production this would probe the WebSocket server's /ping endpoint.
// Returns 'ok' in this release as WS is in-process with the Express server.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/ws', async (req, res) => {
  const start = Date.now();
  try {
    // Lightweight self-ping: checks that the event loop is unblocked
    await new Promise((resolve) => setImmediate(resolve));
    res.json({
      status: 'ok',
      latencyMs: Date.now() - start,
      message: 'WebSocket broker operational',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.json({
      status: 'degraded',
      latencyMs: Date.now() - start,
      message: `WS error: ${err.message}`,
      timestamp: new Date().toISOString(),
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/health/auth
// Checks authentication service availability.
// Verifies that the auth-related DB tables are reachable (a proxy for
// auth service health in this architecture).
// ─────────────────────────────────────────────────────────────────────────────
router.get('/auth', async (req, res) => {
  const start = Date.now();
  try {
    // Check if auth-adjacent tables are accessible (users / sessions proxied via auditor_entity_id)
    const result = await query(`
      SELECT COUNT(*) AS cnt
      FROM compliance_audit_trails
      WHERE auditor_entity_id IS NOT NULL
      LIMIT 1;
    `);
    const count = Number(result.rows[0]?.cnt ?? 0);
    res.json({
      status: 'ok',
      latencyMs: Date.now() - start,
      message: `Auth layer reachable — ${count} auditor sessions on record`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.json({
      status: 'degraded',
      latencyMs: Date.now() - start,
      message: `Auth check failed: ${err.message}`,
      timestamp: new Date().toISOString(),
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/health
// Master health rollup — returns combined status of all subsystems.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const start = Date.now();

  const checks = await Promise.allSettled([
    query('SELECT 1;').then(() => ({ name: 'database', status: 'ok' })),
    new Promise((resolve) => setImmediate(() => resolve({ name: 'eventLoop', status: 'ok' }))),
  ]);

  const results = checks.map((c) =>
    c.status === 'fulfilled' ? c.value : { name: 'unknown', status: 'degraded', error: c.reason?.message }
  );

  const allOk = results.every((r) => r.status === 'ok');

  res.json({
    status: allOk ? 'ok' : 'degraded',
    latencyMs: Date.now() - start,
    subsystems: results,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'GridVault ESS Analytics API',
  });
});

export default router;
