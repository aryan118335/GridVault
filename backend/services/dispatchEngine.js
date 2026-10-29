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
