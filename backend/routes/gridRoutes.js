/**
 * GridVault ESS - Live Grid Telemetry API Routes
 * Module: Live Grid Telemetry & Power Balance (Ayush)
 * Endpoints mounted at /api/grid/*
 */
import express from 'express';
import { query } from '../config/db.js';
import { generateGridTick } from '../services/telemetryWorker.js';

const router = express.Router();

function normalizeRow(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    recorded_at: row.recorded_at,
    solar_mw: Number(row.solar_mw),
    wind_mw: Number(row.wind_mw),
    demand_mw: Number(row.demand_mw),
    net_balance_mw: Number(row.net_balance_mw),
    grid_frequency_hz: Number(row.grid_frequency_hz),
    grid_status: row.grid_status || 'BALANCED',
  };
}

/**
 * GET /api/grid/live
 * Returns the latest 20 telemetry rows from grid_state in chronological order for Chart.js.
 */
router.get('/live', async (_req, res) => {
  const result = await query(
    `SELECT id, recorded_at, solar_mw, wind_mw, demand_mw, net_balance_mw, grid_frequency_hz, grid_status
     FROM grid_state
     ORDER BY recorded_at DESC, id DESC
     LIMIT 20`
  );

  if (result.error) {
    return res.status(500).json({ error: result.error, data: [] });
  }

  const chronological = result.rows.map(normalizeRow).reverse();
  return res.json({
    count: chronological.length,
    data: chronological,
  });
});

export default router;
