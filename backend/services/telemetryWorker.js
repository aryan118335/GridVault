/**
 * GridVault ESS - Live Grid Telemetry Worker
 * Module: Live Grid Telemetry & Power Balance (Ayush)
 * Computes realistic time-of-day solar generation, wind variance, and city power demand,
 * and persists telemetry ticks to PostgreSQL using raw SQL.
 */
import { query } from '../config/db.js';

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
const round2 = (val) => Number(val.toFixed(2));

/**
 * Compute realistic time-of-day solar output, wind variance, city demand,
 * net power balance, AC frequency, and operating status.
 */
export function computeGridTick(now = new Date()) {
  const hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

  // Solar bell curve peaking around 13:00 (0 MW overnight between 19:00 and 06:00)
  let solarMw = 0;
  if (hour >= 6 && hour <= 19) {
    const solarPhase = ((hour - 6) / 13) * Math.PI;
    const cloudNoise = (Math.random() - 0.5) * 18;
    solarMw = clamp(275 * Math.sin(solarPhase) + cloudNoise, 0, 320);
  }

  // Wind generation: stronger overnight/evening with stochastic gust variance
  const windBase = 132 + 28 * Math.cos(((hour - 2) / 24) * 2 * Math.PI);
  const windGust = (Math.random() - 0.5) * 24;
  const windMw = clamp(windBase + windGust, 45, 220);

  // City demand: bimodal curve with morning ramp and evening peak (~19:00)
  const morningPeak = 55 * Math.exp(-Math.pow((hour - 9.5) / 2.6, 2));
  const eveningPeak = 145 * Math.exp(-Math.pow((hour - 19.0) / 3.2, 2));
  const demandNoise = (Math.random() - 0.5) * 16;
  const demandMw = clamp(165 + morningPeak + eveningPeak + demandNoise, 120, 420);

  const solar = round2(solarMw);
  const wind = round2(windMw);
  const demand = round2(demandMw);
  const netBalance = round2(solar + wind - demand);

  let gridStatus = 'BALANCED';
  if (netBalance > 5) {
    gridStatus = 'SURPLUS';
  } else if (netBalance < -5) {
    gridStatus = 'DEFICIT';
  }

  // AC frequency responds subtly to net generation balance around 50.00 Hz
  const frequencyOffset = clamp(netBalance * 0.0008 + (Math.random() - 0.5) * 0.02, -0.25, 0.25);
  const gridFrequencyHz = round2(50.0 + frequencyOffset);

  return {
    recorded_at: now.toISOString(),
    solar_mw: solar,
    wind_mw: wind,
    demand_mw: demand,
    net_balance_mw: netBalance,
    grid_frequency_hz: gridFrequencyHz,
    grid_status: gridStatus,
  };
}

/**
 * Generate one realistic grid telemetry tick and persist it to PostgreSQL grid_state.
 */
export async function generateGridTick(now = new Date()) {
  const tick = computeGridTick(now);

  const insertResult = await query(
    `INSERT INTO grid_state (
       recorded_at,
       solar_mw,
       wind_mw,
       demand_mw,
       net_balance_mw,
       grid_frequency_hz,
       grid_status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, recorded_at, solar_mw, wind_mw, demand_mw, net_balance_mw, grid_frequency_hz, grid_status`,
    [
      tick.recorded_at,
      tick.solar_mw,
      tick.wind_mw,
      tick.demand_mw,
      tick.net_balance_mw,
      tick.grid_frequency_hz,
      tick.grid_status,
    ]
  );

  if (insertResult.error || insertResult.rows.length === 0) {
    throw new Error(insertResult.error || 'Failed to insert grid_state tick');
  }

  return insertResult.rows[0];
}

export default { computeGridTick, generateGridTick };
