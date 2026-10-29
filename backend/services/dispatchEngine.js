/**
 * GridVault ESS - Battery Storage & Real-Time Dispatch Engine
 * Module: Analytics & Financial Backend (Varad Bhardwaj)
 * Milestone: Nov 22, 2026 21:15:00 +0530
 * 
 * Computes net grid balance (Solar + Wind - City Demand), determines
 * optimal battery state transitions (CHARGING, DISCHARGING, STANDBY),
 * enforces State-of-Charge (SOC) safety envelopes (5% - 100%), and
 * logs audit trails to PostgreSQL for regulatory compliance.
 */

import { query } from '../config/db.js';

/**
 * Compute net power balance across renewable generation and city consumption
 * @param {Object} params
 * @param {number} params.solarMw - Real-time or target solar output in MW
 * @param {number} [params.windMw=25] - Baseline wind generation in MW (default: 25 MW)
 * @param {number} params.cityDemandMw - Instantaneous city electrical load in MW
 * @returns {number} Net balance in MW (positive = surplus, negative = deficit)
 */
export function calculateNetGridBalance({ solarMw, cityDemandMw, windMw = 25 }) {
  const solar = Number(solarMw) || 0;
  const wind = Number(windMw) || 0;
  const demand = Number(cityDemandMw) || 0;
  return Number(((solar + wind) - demand).toFixed(2));
}

/**
 * Calculate updated battery SOC adhering to physical operating limits (5% to 100%)
 * @param {number} currentSoc - Current State-of-Charge percentage (0 - 100%)
 * @param {string} mode - 'CHARGING' | 'DISCHARGING' | 'STANDBY'
 * @param {number} powerMw - Dispatched power in MW
 * @param {number} maxCapacityMw - Rated battery power capacity in MW
 * @returns {number} Updated SOC percentage bounded within [5.00, 100.00]
 */
export function calculateNewSoc(currentSoc, mode, powerMw, maxCapacityMw = 100.0) {
  const soc = Number(currentSoc);
  const capacity = Number(maxCapacityMw) || 100.0;
  const power = Number(powerMw) || 0;

  if (mode === 'CHARGING') {
    const socIncrement = Math.max(0.5, (power / capacity) * 5.0);
    return Math.min(100.00, Number((soc + socIncrement).toFixed(2)));
  }

  if (mode === 'DISCHARGING') {
    const socDecrement = Math.max(0.5, (power / capacity) * 5.0);
    return Math.max(5.00, Number((soc - socDecrement).toFixed(2)));
  }

  return soc;
}

/**
- Fetch the latest battery state of charge and telemetry from PostgreSQL
- @returns {Promise<Object>} Latest row from battery_status table
 */
export async function getBatteryStatus() {
  const res = await query(
    `SELECT id, charge_percent, max_capacity_mw, mode, updated_at
     FROM battery_status
     ORDER BY id DESC
     LIMIT 1`
  );

  if (!res.rows || res.rows.length === 0) {
    return {
      id: 1,
      charge_percent: 75.0,
      max_capacity_mw: 100.0,
      mode: 'STANDBY',
      updated_at: new Date().toISOString(),
    };
  }

  return {
    ...res.rows[0],
    charge_percent: parseFloat(res.rows[0].charge_percent),
    max_capacity_mw: parseFloat(res.rows[0].max_capacity_mw),
  };
}

/**
- Evaluate real-time grid conditions, dispatch battery, and persist state & audit log
- @param {Object} params
- @param {number} params.solarMw - Current solar generation in MW
- @param {number} params.cityDemandMw - Current city demand in MW
- @param {number} [params.windMw=25] - Real-time wind generation in MW
- @param {string} [params.triggerReason] - Reason description for audit log
- @returns {Promise<{ battery: Object, log: Object }>}
 */
export async function evaluateDispatch({ solarMw, cityDemandMw, windMw = 25, triggerReason }) {
  const currentBattery = await getBatteryStatus();
  const currentSoc = currentBattery.charge_percent;
  const maxCapacityMw = currentBattery.max_capacity_mw;

  const netBalance = calculateNetGridBalance({ solarMw, cityDemandMw, windMw });

  let mode = 'STANDBY';
  let powerMw = 0;

  if (netBalance > 2.0) {
    if (currentSoc >= 100.0) {
      mode = 'STANDBY';
      powerMw = 0.0;
    } else {
      mode = 'CHARGING';
      powerMw = Math.min(netBalance, maxCapacityMw);
    }
  } else if (netBalance < -2.0) {
    if (currentSoc <= 5.0) {
      mode = 'STANDBY';
      powerMw = 0.0;
    } else {
      mode = 'DISCHARGING';
      powerMw = Math.min(Math.abs(netBalance), maxCapacityMw);
    }
  } else {
    mode = 'STANDBY';
    powerMw = 0.0;
  }

  const newSoc = calculateNewSoc(currentSoc, mode, powerMw, maxCapacityMw);

  let reason = triggerReason;
  if (!reason) {
    if (mode === 'CHARGING') {
      reason = `Excess renewable surplus (+${netBalance.toFixed(1)} MW): charging battery at ${powerMw.toFixed(1)} MW`;
    } else if (mode === 'DISCHARGING') {
      reason = `Feeder deficit (${netBalance.toFixed(1)} MW): discharging ${powerMw.toFixed(1)} MW to shave peak load`;
    } else {
      reason = `Grid balance in equilibrium (${netBalance.toFixed(1)} MW within ±2 MW deadband): battery on standby`;
    }
  }

  const updateRes = await query(
    `UPDATE battery_status
     SET charge_percent = $1, mode = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING id, charge_percent, max_capacity_mw, mode, updated_at`,
    [newSoc, mode, currentBattery.id]
  );

  const updatedBattery = updateRes.rows && updateRes.rows.length > 0
    ? {
        ...updateRes.rows[0],
        charge_percent: parseFloat(updateRes.rows[0].charge_percent),
        max_capacity_mw: parseFloat(updateRes.rows[0].max_capacity_mw),
      }
    : { ...currentBattery, charge_percent: newSoc, mode, updated_at: new Date().toISOString() };

  const logRes = await query(
    `INSERT INTO dispatch_logs (action, power_mw, reason, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING id, action, power_mw, reason, created_at`,
    [mode, powerMw, reason]
  );

  const logEntry = logRes.rows && logRes.rows.length > 0
    ? {
        ...logRes.rows[0],
        power_mw: parseFloat(logRes.rows[0].power_mw),
      }
    : {
        id: Date.now(),
        action: mode,
        power_mw: powerMw,
        reason,
        created_at: new Date().toISOString(),
      };

  return { battery: updatedBattery, log: logEntry };
}
