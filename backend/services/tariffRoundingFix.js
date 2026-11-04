/**
 * GridVault ESS - Tariff Currency Rounding Utility
 * Module: Analytics & Financial Backend (Varad Bhardwaj)
 * Milestone: Nov 04, 2026 15:00:00 +0530
 * Commit: fix(tariff-rounding): patch currency rounding to INR locale standards across tariff calculations
 *
 * Utility module that corrects floating-point drift in demand charge and
 * tariff settlement calculations to INR (Indian Rupee) locale standards.
 *
 * Also patches ArbitrageEngine and PeakShavingMath to use corrected rounding.
 *
 * Key functions:
 *   roundToINR(amount)                 — 2-decimal precision rounding
 *   formatINRLocale(amount)            — Intl.NumberFormat 'en-IN' string
 *   applyRatchetRounding(demandKw, %)  — ratchet clause demand charge
 */

// ─────────────────────────────────────────────────────────────────────────────
// roundToINR(amount)
// Corrects floating-point drift to exactly 2 decimal places (INR paise).
// Uses "round half away from zero" consistent with RBI rounding guidelines.
// ─────────────────────────────────────────────────────────────────────────────
function roundToINR(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return 0;
  // Multiply-round-divide avoids IEEE 754 drift (e.g. 1.005 * 100 = 100.5000000001)
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// formatINRLocale(amount)
// Returns a locale-formatted string: ₹1,23,456.78 (Indian numbering system).
// Uses Intl.NumberFormat 'en-IN' with currency INR, minimumFractionDigits=2.
// ─────────────────────────────────────────────────────────────────────────────
function formatINRLocale(amount) {
  const rounded = roundToINR(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
}

// ─────────────────────────────────────────────────────────────────────────────
// applyRatchetRounding(demandKw, ratchetPct)
// Applies DISCOM ratchet clause: bills at max(actual, ratchet% * contractedKw).
// demandKw     — observed peak demand in kW
// ratchetPct   — ratchet percentage as a decimal (e.g. 0.85 for 85%)
// Returns: { billedDemandKw, ratchetApplied, demandChargeINR }
//
// Standard DISCOM tariff: demand charge = billedDemandKw × ₹650/kW/month
// (₹650 is a representative Mumbai/Delhi HT tariff demand charge; actual
//  value should be fetched from energy_tariff_structures table at runtime.)
// ─────────────────────────────────────────────────────────────────────────────
function applyRatchetRounding(demandKw, ratchetPct, contractedKw, demandChargeRatePerKw = 650) {
  if (typeof demandKw !== 'number' || typeof ratchetPct !== 'number') {
    throw new TypeError('[tariffRoundingFix] demandKw and ratchetPct must be numbers');
  }

  const contracted = typeof contractedKw === 'number' ? contractedKw : demandKw;
  const ratchetFloor = roundToINR(contracted * ratchetPct);
  const ratchetApplied = demandKw < ratchetFloor;
  const billedDemandKw = ratchetApplied ? ratchetFloor : roundToINR(demandKw);
  const demandChargeINR = roundToINR(billedDemandKw * demandChargeRatePerKw);

  return {
    billedDemandKw,
    ratchetApplied,
    ratchetFloorKw: ratchetFloor,
    demandChargeINR,
    demandChargeFormatted: formatINRLocale(demandChargeINR),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// patchArbitrageEngine(engineInstance)
// Wraps the net profit calculation of an ArbitrageEngine instance so all
// monetary outputs are rounded to INR before being returned.
// ─────────────────────────────────────────────────────────────────────────────
function patchArbitrageEngine(engineInstance) {
  if (!engineInstance || typeof engineInstance.calculateDailyArbitrage !== 'function') {
    console.warn('[tariffRoundingFix] patchArbitrageEngine: invalid engine instance — skipping patch');
    return engineInstance;
  }

  const original = engineInstance.calculateDailyArbitrage.bind(engineInstance);

  engineInstance.calculateDailyArbitrage = function patchedCalculateDailyArbitrage(params) {
    const result = original(params);
    return {
      ...result,
      dailyGrossRevenue: roundToINR(result.dailyGrossRevenue),
      dailyEnergyCost: roundToINR(result.dailyEnergyCost),
      dailyNetArbitrageProfit: roundToINR(result.dailyNetArbitrageProfit),
      annualProjectedRevenue: roundToINR(result.annualProjectedRevenue),
    };
  };

  return engineInstance;
}

// ─────────────────────────────────────────────────────────────────────────────
// patchPeakShavingMath(mathInstance)
// Wraps PeakShavingMath monthly savings so demand charges are INR-rounded.
// ─────────────────────────────────────────────────────────────────────────────
function patchPeakShavingMath(mathInstance) {
  if (!mathInstance || typeof mathInstance.calculateMonthlySavings !== 'function') {
    console.warn('[tariffRoundingFix] patchPeakShavingMath: invalid instance — skipping patch');
    return mathInstance;
  }

  const original = mathInstance.calculateMonthlySavings.bind(mathInstance);

  mathInstance.calculateMonthlySavings = function patchedCalculateMonthlySavings(params) {
    const result = original(params);
    return {
      ...result,
      unmanagedDemandChargeINR: roundToINR(result.unmanagedDemandChargeINR),
      managedDemandChargeINR: roundToINR(result.managedDemandChargeINR),
      monthlySavingsINR: roundToINR(result.monthlySavingsINR),
      annualSavingsINR: roundToINR(result.annualSavingsINR),
    };
  };

  return mathInstance;
}

export {
  roundToINR,
  formatINRLocale,
  applyRatchetRounding,
  patchArbitrageEngine,
  patchPeakShavingMath,
};
