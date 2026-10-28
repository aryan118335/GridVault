/**
 * GridVault ESS - Peak Shaving Demand Charge Reduction Math
 * Module: Analytics & Financial Backend (Varad Bhardwaj)
 * Milestone: Oct 28, 2026 15:15:00 +0530
 * Commit: feat(peak-shaving): implement peak shaving demand charge reduction math
 * 
 * Algorithm calculating monthly peak demand reduction (kW shaved),
 * demand ratchet compliance, and resulting cost savings on utility demand tariffs.
 */

import { query } from '../config/db.js';

export class PeakShavingMath {
  constructor(options = {}) {
    this.demandSurchargePerKwMonth = options.demandSurchargePerKwMonth || 450.00; // ₹450 / kW-month
    this.contractedDemandKw = options.contractedDemandKw || 520.00; // 520 kW contracted capacity
    this.demandRatchetPct = options.demandRatchetPct || 80.00; // 80% minimum contracted demand ratchet
    this.slidingWindowMinutes = options.slidingWindowMinutes || 15; // 15-minute standard integration window
    this.penaltyExceedanceMultiplier = options.penaltyExceedanceMultiplier || 1.50; // 1.5x surcharge for overshooting contract
  }

  /**
   * Calculate monthly peak demand reduction and tariff savings
   * @param {Object} params
   * @param {number} params.unmanagedPeakKw - Maximum registered peak demand without ESS (e.g., 520 kW)
   * @param {number} params.dispatchedBatteryPowerKw - Active battery power injected during peak (e.g., 380 kW)
   * @param {number} [params.customDemandSurcharge] - Custom ₹/kW-month tariff override
   */
  calculateMonthlySavings({
    unmanagedPeakKw = 520.00,
    dispatchedBatteryPowerKw = 380.00,
    customDemandSurcharge = null,
  }) {
    const surchargeRate = customDemandSurcharge !== null ? customDemandSurcharge : this.demandSurchargePerKwMonth;

    // Minimum billing baseline under utility ratchet (80% of contracted demand)
    const minimumRatchetDemandKw = this.contractedDemandKw * (this.demandRatchetPct / 100);

    // Shaved peak demand seen by the grid meter
    const shavedPeakKw = Math.max(0, unmanagedPeakKw - dispatchedBatteryPowerKw);

    // Billed demand after applying ratchet floor
    const unmanagedBilledDemandKw = Math.max(unmanagedPeakKw, minimumRatchetDemandKw);
    const managedBilledDemandKw = Math.max(shavedPeakKw, minimumRatchetDemandKw);

    // Baseline demand cost without ESS
    let unmanagedDemandCost = unmanagedBilledDemandKw * surchargeRate;
    if (unmanagedPeakKw > this.contractedDemandKw) {
      // Penalty for exceedance above contract
      const excessKw = unmanagedPeakKw - this.contractedDemandKw;
      unmanagedDemandCost += excessKw * surchargeRate * (this.penaltyExceedanceMultiplier - 1.0);
    }

    // Managed demand cost with GridVault ESS peak shaving
    let managedDemandCost = managedBilledDemandKw * surchargeRate;
    if (shavedPeakKw > this.contractedDemandKw) {
      const excessKw = shavedPeakKw - this.contractedDemandKw;
      managedDemandCost += excessKw * surchargeRate * (this.penaltyExceedanceMultiplier - 1.0);
    }

    // Net demand charge reduction savings
    const netMonthlySavings = Math.max(0, unmanagedDemandCost - managedDemandCost);
    const annualizedDemandSavings = netMonthlySavings * 12;
    const peakReductionPct = unmanagedPeakKw > 0
      ? (((unmanagedPeakKw - shavedPeakKw) / unmanagedPeakKw) * 100)
      : 0;

    return {
      unmanagedPeakKw: Number(unmanagedPeakKw.toFixed(2)),
      dispatchedBatteryPowerKw: Number(dispatchedBatteryPowerKw.toFixed(2)),
      shavedPeakKw: Number(shavedPeakKw.toFixed(2)),
      effectiveKwShaved: Number((unmanagedPeakKw - shavedPeakKw).toFixed(2)),
      peakReductionPct: Number(peakReductionPct.toFixed(2)),
      unmanagedBilledDemandKw: Number(unmanagedBilledDemandKw.toFixed(2)),
      managedBilledDemandKw: Number(managedBilledDemandKw.toFixed(2)),
      unmanagedDemandCost: Number(unmanagedDemandCost.toFixed(2)),
      managedDemandCost: Number(managedDemandCost.toFixed(2)),
      netMonthlySavings: Number(netMonthlySavings.toFixed(2)),
      annualizedDemandSavings: Number(annualizedDemandSavings.toFixed(2)),
      surchargeRatePerKw: surchargeRate,
    };
  }

  /**
   * Pull active substation peak demand config from Neon DB and compute savings
   */
  async computeSubstationSavings(tariffPlanCode = 'COMM-HT-01', unmanagedPeakKw = 520.00, batteryDispatchKw = 380.00) {
    const sql = `
      SELECT p.demand_charge_per_kw_month, p.contracted_demand_kw, p.ratchet_percentage, p.penalty_exceedance_multiplier
      FROM peak_demand_charges p
      JOIN tariff_plans t ON p.tariff_plan_id = t.id
      WHERE t.code = $1
      LIMIT 1;
    `;
    const res = await query(sql, [tariffPlanCode]);

    if (res.rows && res.rows.length > 0) {
      const row = res.rows[0];
      const engine = new PeakShavingMath({
        demandSurchargePerKwMonth: Number(row.demand_charge_per_kw_month),
        contractedDemandKw: Number(row.contracted_demand_kw),
        demandRatchetPct: Number(row.ratchet_percentage),
        penaltyExceedanceMultiplier: Number(row.penalty_exceedance_multiplier),
      });
      return engine.calculateMonthlySavings({ unmanagedPeakKw, dispatchedBatteryPowerKw: batteryDispatchKw });
    }

    return this.calculateMonthlySavings({ unmanagedPeakKw, dispatchedBatteryPowerKw: batteryDispatchKw });
  }
}

export default new PeakShavingMath();
