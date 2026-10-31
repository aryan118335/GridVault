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
