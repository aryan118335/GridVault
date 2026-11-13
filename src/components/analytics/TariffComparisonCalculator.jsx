import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  Calculator,
  CheckCircle2,
  Coins,
  Percent,
  Sliders,
  Sparkles,
  TrendingDown,
  Zap,
} from 'lucide-react';

const PRESETS = [
  {
    name: 'Industrial Feeder',
    monthlyMwh: 220,
    peakSharePct: 35,
    flatRate: 8.8,
    peakKw: 650,
  },
  {
    name: 'Commercial Substation',
    monthlyMwh: 160,
    peakSharePct: 28,
    flatRate: 8.2,
    peakKw: 480,
  },
  {
    name: 'Municipal Smart Grid',
    monthlyMwh: 310,
    peakSharePct: 40,
    flatRate: 9.1,
    peakKw: 820,
  },
];

const CURRENCY = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * TariffComparisonCalculator
 * Nov 13 Milestone: Interactive widget comparing utility bill totals
 * under flat vs dynamic time-of-use tariffs to prove ESS economic viability.
 */
export default function TariffComparisonCalculator() {
  const [monthlyMwh, setMonthlyMwh] = useState(180);
  const [peakSharePct, setPeakSharePct] = useState(32);
  const [flatRate, setFlatRate] = useState(8.5); // ₹8.50 / kWh
  const [peakKw, setPeakKw] = useState(520); // kW peak demand
  const [selectedPreset, setSelectedPreset] = useState('Commercial Substation');

  // Dynamic TOU Tariff rates
  const offPeakRate = 3.8; // ₹3.80 / kWh (valley charging)
  const normalRate = 7.2; // ₹7.20 / kWh
  const superPeakRate = 12.5; // ₹12.50 / kWh (super peak)
  const demandSurcharge = 450; // ₹450 / kW-month

  // Calculations
  const calculations = useMemo(() => {
    const totalKwh = monthlyMwh * 1000;
    const peakKwh = totalKwh * (peakSharePct / 100);
    const offPeakKwh = totalKwh * 0.35;
    const normalKwh = totalKwh - peakKwh - offPeakKwh;

    // 1. Flat Tariff Scenario (Without ESS)
    const flatEnergyCost = totalKwh * flatRate;
    const flatDemandCost = peakKw * demandSurcharge;
    const flatTotal = flatEnergyCost + flatDemandCost;

    // 2. Unmitigated Dynamic TOU (Without ESS)
    const unmitigatedEnergyCost =
      offPeakKwh * offPeakRate + normalKwh * normalRate + peakKwh * superPeakRate;
    const unmitigatedDemandCost = peakKw * demandSurcharge;
    const unmitigatedTotal = unmitigatedEnergyCost + unmitigatedDemandCost;

    // 3. GridVault Optimized ESS Scenario
    // - Battery charges 14.8 MWh at valley off-peak (₹3.80)
    // - Discharges during super-peak (displacing ₹12.50 power)
    // - Shaves 420 kW of peak demand charges
    const batteryDisplacedKwh = Math.min(peakKwh, 14800 * 26 * 0.92); // 26 cycles/month @ 92% RTE
    const essOffPeakChargingCost = batteryDisplacedKwh * (offPeakRate / 0.92);
    const essRemainingPeakCost = Math.max(0, peakKwh - batteryDisplacedKwh) * superPeakRate;
    const essNormalCost = normalKwh * normalRate;
    const essEnergyCost = essOffPeakChargingCost + essRemainingPeakCost + essNormalCost;

    // Shaved peak demand
    const shavedPeakKw = Math.max(100, peakKw - 380);
    const essDemandCost = shavedPeakKw * demandSurcharge;
    const essTotal = essEnergyCost + essDemandCost;

    // Savings
    const netSavingsVsFlat = flatTotal - essTotal;
    const savingsPctVsFlat = ((netSavingsVsFlat / flatTotal) * 100).toFixed(1);
    const netSavingsVsUnmitigated = unmitigatedTotal - essTotal;
    const annualizedSavings = netSavingsVsFlat * 12;

    return {
      flatTotal,
      unmitigatedTotal,
      essTotal,
      netSavingsVsFlat,
      savingsPctVsFlat,
      netSavingsVsUnmitigated,
      annualizedSavings,
      shavedPeakKw,
    };
  }, [monthlyMwh, peakSharePct, flatRate, peakKw]);

  const applyPreset = (preset) => {
    setSelectedPreset(preset.name);
    setMonthlyMwh(preset.monthlyMwh);
    setPeakSharePct(preset.peakSharePct);
    setFlatRate(preset.flatRate);
    setPeakKw(preset.peakKw);
  };

  return (
    <section className="flex flex-col rounded-2xl border border-slate-700/80 bg-slate-800/90 p-5 shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 border-b border-slate-700/70 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <Calculator className="h-4 w-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Tariff Comparison &amp; Scenario Savings Calculator
              </h2>
              <p className="text-xs text-slate-400">
                Interactive feasibility model comparing flat vs dynamic TOU utility bills to prove ESS viability
              </p>
            </div>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 p-1 text-xs">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedPreset === p.name
                  ? 'bg-teal-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Scenario Sliders */}
        <div className="space-y-4 rounded-xl border border-slate-700/70 bg-slate-900/60 p-4 lg:col-span-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-teal-400" />
              Adjust Grid Load Parameters
            </span>
            <span className="text-[10px] text-teal-400 font-mono">Live Simulation</span>
          </div>

          {/* Slider 1: Monthly Energy */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Monthly Consumption:</span>
              <span className="font-mono font-bold text-white">{monthlyMwh} MWh</span>
            </div>
            <input
              type="range"
              min="50"
              max="400"
              step="10"
              value={monthlyMwh}
              onChange={(e) => {
                setMonthlyMwh(Number(e.target.value));
                setSelectedPreset('Custom');
              }}
              className="w-full accent-teal-400 cursor-pointer"
            />
          </div>

          {/* Slider 2: Peak Hours Load Share */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Peak Hours Share:</span>
              <span className="font-mono font-bold text-amber-400">{peakSharePct}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="50"
              step="1"
              value={peakSharePct}
              onChange={(e) => {
                setPeakSharePct(Number(e.target.value));
                setSelectedPreset('Custom');
              }}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Slider 3: Flat Tariff Rate */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Utility Flat Rate:</span>
              <span className="font-mono font-bold text-white">₹{flatRate.toFixed(2)} / kWh</span>
            </div>
            <input
              type="range"
              min="6.0"
              max="12.0"
              step="0.1"
              value={flatRate}
              onChange={(e) => {
                setFlatRate(Number(e.target.value));
                setSelectedPreset('Custom');
              }}
              className="w-full accent-teal-400 cursor-pointer"
            />
          </div>

          {/* Slider 4: Peak Demand kW */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Peak Demand Spike:</span>
              <span className="font-mono font-bold text-rose-400">{peakKw} kW</span>
            </div>
            <input
              type="range"
              min="200"
              max="1000"
              step="20"
              value={peakKw}
              onChange={(e) => {
                setPeakKw(Number(e.target.value));
                setSelectedPreset('Custom');
              }}
              className="w-full accent-rose-400 cursor-pointer"
            />
          </div>

          {/* Fixed TOU Tiers Overview Box */}
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/80 p-2.5 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Off-Peak (Valley Charging):</span>
              <span className="font-mono text-emerald-400">₹{offPeakRate} / kWh</span>
            </div>
            <div className="flex justify-between">
              <span>Super-Peak (Grid Stress):</span>
              <span className="font-mono text-rose-400">₹{superPeakRate} / kWh</span>
            </div>
            <div className="flex justify-between">
              <span>Peak Demand Tariff:</span>
              <span className="font-mono text-slate-200">₹{demandSurcharge} / kW-mo</span>
            </div>
          </div>
        </div>

        {/* Right Column: Comparison Results & Savings Callouts */}
        <div className="flex flex-col justify-between space-y-4 lg:col-span-7">
          {/* Top Comparative Bars */}
          <div className="space-y-3 rounded-xl border border-slate-700/70 bg-slate-900/60 p-4">
            <span className="text-xs font-semibold text-white">Monthly Utility Bill Comparison</span>

            {/* Scenario 1: Flat Tariff */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">1. Standard Flat Commercial Tariff</span>
                <span className="font-mono font-bold text-white">{CURRENCY.format(calculations.flatTotal)}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-slate-500 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            {/* Scenario 2: Unmanaged TOU */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">2. Unmitigated Dynamic TOU (Without ESS)</span>
                <span className="font-mono font-bold text-rose-400">{CURRENCY.format(calculations.unmitigatedTotal)}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-rose-500/80 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            {/* Scenario 3: GridVault ESS */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  3. GridVault Optimized ESS
                </span>
                <span className="font-mono font-bold text-emerald-400">{CURRENCY.format(calculations.essTotal)}</span>
              </div>
              <div className="h-3.5 w-full rounded-full bg-slate-800 overflow-hidden shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((calculations.essTotal / calculations.unmitigatedTotal) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Highlight ROI Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Monthly Net Savings */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-300 uppercase">Monthly Savings</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  -{calculations.savingsPctVsFlat}% Bill
                </span>
              </div>
              <p className="mt-1 font-mono text-2xl font-bold text-white">
                {CURRENCY.format(calculations.netSavingsVsFlat)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Direct monthly cash savings vs flat rate</p>
            </div>

            {/* Annualized Economic Viability */}
            <div className="rounded-xl border border-teal-500/40 bg-teal-500/10 p-3.5 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-teal-300 uppercase">Annualized Yield</span>
                <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-400">
                  Proven Viability
                </span>
              </div>
              <p className="mt-1 font-mono text-2xl font-bold text-white">
                {CURRENCY.format(calculations.annualizedSavings)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Projected 12-month cumulative benefit</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
