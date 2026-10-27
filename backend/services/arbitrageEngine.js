/**
 * GridVault ESS - Energy Arbitrage ROI Financial Math Engine
 * Module: Analytics & Financial Backend (Varad Bhardwaj)
 * Milestone: Oct 27, 2026 15:45:00 +0530
 * Commit: feat(arbitrage-engine): build financial math engine for energy arbitrage ROI
 * 
 * Computes net revenue from buying energy at valley off-peak prices,
 * storing in 14.8 MWh LFP battery, and discharging during evening super-peak tariff.
 */

import { query } from '../config/db.js';

export class ArbitrageEngine {
  constructor(options = {}) {
    this.packCapacityKwh = options.packCapacityKwh || 14800; // 14.8 MWh LFP container
    this.roundTripEfficiency = options.roundTripEfficiency || 0.92; // 92% RTE
    this.maxDepthOfDischarge = options.maxDepthOfDischarge || 0.85; // 85% DOD operational envelope
    this.degradationCostPerKwhCycled = options.degradationCostPerKwhCycled || 0.65; // ₹0.65 / kWh wear cost
  }

  /**
   * Calculate daily net energy arbitrage economics
   * @param {Object} params
   * @param {number} params.valleyBuyPriceKwh - Buying price during night valley (e.g. ₹3.80 / kWh)
   * @param {number} params.peakSellPriceKwh - Discharging value during evening peak (e.g. ₹12.50 / kWh)
   * @param {number} [params.cyclesPerDay=1.0] - Dispatched equivalent full cycles
   */
  calculateDailyArbitrage({ valleyBuyPriceKwh = 3.80, peakSellPriceKwh = 12.50, cyclesPerDay = 1.0 }) {
    // Usable energy per cycle factoring DOD
    const usableCapacityKwh = this.packCapacityKwh * this.maxDepthOfDischarge; // 12,580 kWh
    const dailyDischargedKwh = usableCapacityKwh * cyclesPerDay;

    // Energy needed from grid to charge battery factoring RTE losses
    const dailyChargingEnergyKwh = dailyDischargedKwh / this.roundTripEfficiency; // ~13,674 kWh
    const chargingEnergyCost = dailyChargingEnergyKwh * valleyBuyPriceKwh;

    // Revenue / avoided cost from discharging during peak hours
    const peakDischargeGrossRevenue = dailyDischargedKwh * peakSellPriceKwh;

    // Gross spread revenue
    const grossSpreadRevenue = peakDischargeGrossRevenue - chargingEnergyCost;

    // Battery electrochemical wear cost
    const batteryDegradationCost = dailyDischargedKwh * this.degradationCostPerKwhCycled;

    // Net arbitrage profit
    const netArbitrageRevenue = grossSpreadRevenue - batteryDegradationCost;
    const profitMarginPct = grossSpreadRevenue > 0
      ? ((netArbitrageRevenue / grossSpreadRevenue) * 100)
      : 0;

    return {
      dailyDischargedKwh: Math.round(dailyDischargedKwh),
      dailyChargingEnergyKwh: Math.round(dailyChargingEnergyKwh),
      chargingEnergyCost: Number(chargingEnergyCost.toFixed(2)),
      peakDischargeGrossRevenue: Number(peakDischargeGrossRevenue.toFixed(2)),
      grossSpreadRevenue: Number(grossSpreadRevenue.toFixed(2)),
      batteryDegradationCost: Number(batteryDegradationCost.toFixed(2)),
      netArbitrageRevenue: Number(netArbitrageRevenue.toFixed(2)),
      effectiveSpreadPerKwh: Number(((peakSellPriceKwh * this.roundTripEfficiency) - valleyBuyPriceKwh - this.degradationCostPerKwhCycled).toFixed(4)),
      profitMarginPct: Number(profitMarginPct.toFixed(2)),
      isEconomicallyViable: netArbitrageRevenue > 0,
    };
  }

  /**
   * Fetch active TOU tiers from Neon DB and compute live arbitrage spread
   */
  async computeLiveTariffArbitrage(tariffPlanCode = 'COMM-HT-01') {
    const sql = `
      SELECT t.tier_name, t.energy_rate_per_kwh, t.start_time, t.end_time
      FROM time_of_use_tiers t
      JOIN tariff_plans p ON t.tariff_plan_id = p.id
      WHERE p.code = $1
      ORDER BY t.energy_rate_per_kwh ASC;
    `;
    const res = await query(sql, [tariffPlanCode]);

    if (res.rows && res.rows.length >= 2) {
      const valleyTier = res.rows[0]; // Lowest rate (valley buy)
      const peakTier = res.rows[res.rows.length - 1]; // Highest rate (peak displace)

      const valleyRate = Number(valleyTier.energy_rate_per_kwh);
      const peakRate = Number(peakTier.energy_rate_per_kwh);

      return {
        tariffPlanCode,
        valleyTier: { name: valleyTier.tier_name, rate: valleyRate, window: `${valleyTier.start_time}-${valleyTier.end_time}` },
        peakTier: { name: peakTier.tier_name, rate: peakRate, window: `${peakTier.start_time}-${peakTier.end_time}` },
        ...this.calculateDailyArbitrage({ valleyBuyPriceKwh: valleyRate, peakSellPriceKwh: peakRate }),
      };
    }

    // Default simulation fallback matching Commercial Substation
    return {
      tariffPlanCode,
      valleyTier: { name: 'Off-Peak Valley (Charging)', rate: 3.80, window: '23:00-06:00' },
      peakTier: { name: 'Super-Peak Stress (Discharging)', rate: 12.50, window: '18:00-23:00' },
      ...this.calculateDailyArbitrage({ valleyBuyPriceKwh: 3.80, peakSellPriceKwh: 12.50 }),
    };
  }
}

export default new ArbitrageEngine();
