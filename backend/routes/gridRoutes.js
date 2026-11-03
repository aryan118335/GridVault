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

/**
 * GET /api/grid/summary
 * Returns the latest telemetry row plus 24-hour aggregates (peak demand,
 * average renewable generation, renewable share %, and current frequency).
 */
router.get('/summary', async (_req, res) => {
  const [recentRes, aggRes] = await Promise.all([
    query(
      `SELECT id, recorded_at, solar_mw, wind_mw, demand_mw, net_balance_mw, grid_frequency_hz, grid_status
       FROM grid_state
       ORDER BY recorded_at DESC, id DESC
       LIMIT 12`
    ),
    query(
      `SELECT
         COUNT(*)::int AS sample_count,
         COALESCE(MAX(demand_mw), 0)::float8 AS peak_demand_mw,
         COALESCE(ROUND(AVG(solar_mw + wind_mw)::numeric, 2), 0)::float8 AS avg_renewable_mw,
         COALESCE(ROUND(AVG(demand_mw)::numeric, 2), 0)::float8 AS avg_demand_mw,
         COALESCE(SUM(solar_mw + wind_mw), 0)::float8 AS total_renewable_mw,
         COALESCE(SUM(demand_mw), 0)::float8 AS total_demand_mw
       FROM grid_state
       WHERE recorded_at >= NOW() - INTERVAL '24 hours'`
    ),
  ]);

  if (recentRes.error || aggRes.error) {
    return res.status(500).json({ error: recentRes.error || aggRes.error });
  }

  const recentRows = recentRes.rows.map(normalizeRow);
  const latest = recentRows[0] || null;
  const baseline = recentRows[recentRows.length - 1] || latest;
  const agg = aggRes.rows[0] || {};

  const totalDemand = Number(agg.total_demand_mw || 0);
  const totalRenewable = Number(agg.total_renewable_mw || 0);
  const renewableSharePct =
    totalDemand > 0 ? Number(Math.min(100, (totalRenewable / totalDemand) * 100).toFixed(1)) : 0;

  const calcDeltaPct = (curr, prev) => {
    if (!prev || prev === 0) return 0;
    return Number((((curr - prev) / prev) * 100).toFixed(1));
  };

  const chronological = [...recentRows].reverse();

  return res.json({
    latest,
    aggregates_24h: {
      peak_demand_mw: Number(Number(agg.peak_demand_mw || 0).toFixed(2)),
      avg_renewable_mw: Number(Number(agg.avg_renewable_mw || 0).toFixed(2)),
      renewable_share_pct: renewableSharePct,
      current_frequency_hz: latest ? latest.grid_frequency_hz : 50.0,
      sample_count: Number(agg.sample_count || 0),
      solar_delta_pct: latest && baseline ? calcDeltaPct(latest.solar_mw, baseline.solar_mw) : 0,
      wind_delta_pct: latest && baseline ? calcDeltaPct(latest.wind_mw, baseline.wind_mw) : 0,
    },
    sparklines: {
      solar: chronological.map((r) => r.solar_mw),
      wind: chronological.map((r) => r.wind_mw),
      demand: chronological.map((r) => r.demand_mw),
    },
  });
});

/**
 * GET /api/grid/history?hours=24
 * Returns historical grid_state rows within the requested rolling hour window.
 */
router.get('/history', async (req, res) => {
  const parsedHours = Number(req.query.hours);
  const hours = Number.isFinite(parsedHours) ? Math.min(168, Math.max(1, Math.round(parsedHours))) : 24;

  const result = await query(
    `SELECT id, recorded_at, solar_mw, wind_mw, demand_mw, net_balance_mw, grid_frequency_hz, grid_status
     FROM grid_state
     WHERE recorded_at >= NOW() - ($1::int * INTERVAL '1 hour')
     ORDER BY recorded_at ASC, id ASC`,
    [hours]
  );

  if (result.error) {
    return res.status(500).json({ error: result.error, hours, data: [] });
  }

  const rows = result.rows.map(normalizeRow);
  return res.json({
    hours,
    count: rows.length,
    data: rows,
  });
});

/**
 * POST /api/grid/tick
 * Manually triggers generateGridTick() and returns the newly inserted telemetry row.
 */
router.post('/tick', async (_req, res) => {
  try {
    const inserted = await generateGridTick();
    return res.status(201).json({
      status: 'created',
      data: normalizeRow(inserted),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to generate grid tick' });
  }
});

export default router;
