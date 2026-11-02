/**
 * GridVault ESS - Battery Simulation & Real-Time Dispatch API Routes
 * Module: Simulation & Control Backend (Varad Bhardwaj)
 * Milestone: Nov 22, 2026 21:45:00 +0530
 * 
 * Express router exposing operational battery endpoints and dispatch simulation hooks.
 */

import express from 'express';
import { query } from '../config/db.js';
import {
  getBatteryStatus,
  simulateHeavyRain,
  evaluateDispatch,
} from '../services/dispatchEngine.js';

const router = express.Router();

/**
 * GET /battery/status
 * Retrieve current battery state-of-charge, operational mode, and power flow
 */
router.get('/battery/status', async (req, res) => {
  try {
    const status = await getBatteryStatus();
    // Fetch latest dispatched power from audit log for UI synchronization
    const logRes = await query(
      `SELECT power_mw, action
       FROM dispatch_logs
       ORDER BY created_at DESC, id DESC
       LIMIT 1`
    );
    const lastLog = logRes.rows && logRes.rows.length > 0 ? logRes.rows[0] : null;

    const isDischarging = status.mode === 'DISCHARGING';
    const powerMw = lastLog ? parseFloat(lastLog.power_mw) : 0;

    return res.json({
      ...status,
      is_discharging: isDischarging,
      power_mw: powerMw,
    });
  } catch (err) {
    console.error('[Simulation API] Error fetching battery status:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to fetch battery status' });
  }
});

export default router;

/**
- POST /simulate/heavy-rain
- Simulate torrential rain cutting solar generation by 75%
- Body: { solarOutput: number, cityDemand: number }
 */
router.post('/simulate/heavy-rain', async (req, res) => {
  try {
    const { solarOutput = 50, cityDemand = 80 } = req.body || {};
    const result = await simulateHeavyRain({
      solarOutput: Number(solarOutput),
      cityDemand: Number(cityDemand),
    });

    return res.json({
      success: true,
      scenario: 'HEAVY_RAIN',
      solar_reduction_pct: 75,
      ...result,
    });
  } catch (err) {
    console.error('[Simulation API] Error running heavy-rain simulation:', err.message);
    return res.status(500).json({ error: err.message || 'Simulation execution failed' });
  }
});

/**
- POST /simulate/override
- Manual operator control slider override for solar generation and city demand
- Body: { solarOutput: number, cityDemand: number }
 */
router.post('/simulate/override', async (req, res) => {
  try {
    const { solarOutput = 50, cityDemand = 80 } = req.body || {};
    const result = await evaluateDispatch({
      solarMw: Number(solarOutput),
      cityDemandMw: Number(cityDemand),
    });

    return res.json({
      success: true,
      message: 'Manual grid override evaluated and applied',
      ...result,
    });
  } catch (err) {
    console.error('[Simulation API] Error evaluating manual override:', err.message);
    return res.status(500).json({ error: err.message || 'Override evaluation failed' });
  }
});
