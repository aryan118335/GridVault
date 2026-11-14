import React, { useMemo, useState } from 'react';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { CheckCircle2, DollarSign, Milestone, Sparkles, TrendingUp } from 'lucide-react';
import { formatCurrency } from './formatters.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// 60-Month (5-Year) projection data with breakeven inflection at Month 45 (3.8 Years)
const CAPEX_BASELINE = 25000000; // ₹2.5 Crore initial ESS turnkey Capex (14.8 MWh LFP + Inverters)

function generatePaybackData() {
  const points = [];
  let cumulative = 0;

  for (let month = 0; month <= 60; month += 3) {
    if (month === 0) {
      cumulative = 0;
    } else {
      // Monthly savings averaging ~₹5.6L with seasonal solar/wind peaks
      const monthlyRate = 560000 + Math.sin(month * 0.25) * 45000;
      cumulative += monthlyRate * 3;
    }

    const year = (month / 12).toFixed(1);
    const label = month === 0 ? 'Day 0' : `M${month} (${year}y)`;

    points.push({
      month,
      label,
      capex: CAPEX_BASELINE,
      cashFlow: Math.round(cumulative),
      netProfit: Math.round(cumulative - CAPEX_BASELINE),
    });
  }
  return points;
}

/**
 * PaybackCurveChart
 * Nov 08 Milestone: Line chart visualizing cumulative cash flows against initial Capex investment,
 * highlighting the breakeven payback inflection point at Year 3.8 (Month 45).
 */
export default function PaybackCurveChart() {
  const [dataPoints] = useState(() => generatePaybackData());
  const [activeHorizon, setActiveHorizon] = useState('60M'); // '60M' (5Y) | '36M' (3Y)

  const filteredPoints = useMemo(() => {
    if (activeHorizon === '36M') {
      return dataPoints.filter((p) => p.month <= 36);
    }
    return dataPoints;
  }, [dataPoints, activeHorizon]);

  // Key metrics
  const breakevenMonth = 45; // 3.8 Years
  const currentMonthProgress = 14; // Current operational age (Month 14)
  const currentRecovered = 8240000; // ₹82.4L recovered so far
  const recoveryPct = ((currentRecovered / CAPEX_BASELINE) * 100).toFixed(1);

  const chartData = useMemo(() => {
    return {
      labels: filteredPoints.map((p) => p.label),
      datasets: [
        {
          label: 'Initial Turnkey Capex',
          data: filteredPoints.map((p) => p.capex),
          borderColor: '#EF4444', // Red baseline
          borderWidth: 2,
          borderDash: [6, 6],
          pointRadius: 0,
          fill: false,
        },
        {
          label: 'Cumulative Cash Inflow (Arbitrage + Shaving)',
          data: filteredPoints.map((p) => p.cashFlow),
          borderColor: '#10B981', // Emerald green
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          pointRadius: filteredPoints.map((p) => (p.month === breakevenMonth ? 7 : 3)),
          pointBackgroundColor: filteredPoints.map((p) =>
            p.month === breakevenMonth ? '#F59E0B' : '#10B981'
          ),
          pointBorderColor: '#0F172A',
          pointBorderWidth: 2,
          pointHoverRadius: 8,
        },
      ],
    };
  }, [filteredPoints]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 350 },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderColor: 'rgba(51, 65, 85, 0.9)',
          borderWidth: 1,
          titleColor: '#CBD5E1',
          bodyColor: '#F8FAFC',
          padding: 12,
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed.y ?? 0;
              return ` ${ctx.dataset.label}: ${formatCurrency(val)}`;
            },
            afterBody: (items) => {
              const idx = items[0]?.dataIndex;
              const point = filteredPoints[idx];
              if (!point) return '';
              const diff = point.netProfit;
              return diff >= 0
                ? ` 🎉 Net ROI Profit: +${formatCurrency(diff)}`
                : ` ⏳ Capex Deficit: -${formatCurrency(Math.abs(diff))}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(148, 163, 184, 0.08)' },
          ticks: {
            color: '#64748B',
            font: { family: 'ui-monospace, monospace', size: 10 },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, 0.10)' },
          ticks: {
            color: '#64748B',
            font: { family: 'ui-monospace, monospace', size: 10 },
            callback: (val) => `₹${(val / 10000000).toFixed(1)} Cr`,
          },
        },
      },
    }),
    [filteredPoints]
  );

  return (
    <section className="flex flex-col rounded-2xl border border-slate-700/80 bg-slate-800/90 p-5 shadow-lg backdrop-blur-sm">
      {/* Chart Header */}
      <div className="mb-5 flex flex-col gap-4 border-b border-slate-700/70 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <TrendingUp className="h-4 w-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Cumulative ROI vs Capex Payback Curve
              </h2>
              <p className="text-xs text-slate-400">
                Breakeven payback inflection model with 5-year cumulative cash flow projections
              </p>
            </div>
          </div>
        </div>

        {/* Range Toggle */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900/90 p-0.5">
            <button
              type="button"
              onClick={() => setActiveHorizon('60M')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeHorizon === '60M'
                  ? 'bg-teal-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              5-Year Horizon (60M)
            </button>
            <button
              type="button"
              onClick={() => setActiveHorizon('36M')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeHorizon === '36M'
                  ? 'bg-teal-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3-Year Horizon (36M)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Capex Baseline */}
        <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-3">
          <span className="text-[11px] font-medium text-slate-400">Total ESS Capex</span>
          <div className="mt-0.5 flex items-baseline gap-1.5 font-mono">
            <span className="text-lg font-bold text-white">
              {formatCurrency(CAPEX_BASELINE)}
            </span>
          </div>
          <span className="text-[10px] text-rose-400">Turnkey 14.8MWh Capital Cost</span>
        </div>

        {/* Current Recovery */}
        <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-3">
          <span className="text-[11px] font-medium text-slate-400">Recovered to Date</span>
          <div className="mt-0.5 flex items-baseline gap-1.5 font-mono">
            <span className="text-lg font-bold text-emerald-400">
              {formatCurrency(currentRecovered)}
            </span>
            <span className="text-xs text-slate-400">({recoveryPct}%)</span>
          </div>
          <span className="text-[10px] text-emerald-400/90 font-medium">Month 14 Operation</span>
        </div>

        {/* Breakeven Inflection Milestone */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 shadow-[0_0_16px_rgba(245,158,11,0.15)]">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300">
            <Milestone className="h-3.5 w-3.5" />
            Breakeven Inflection Point
          </span>
          <div className="mt-0.5 flex items-baseline gap-1.5 font-mono">
            <span className="text-lg font-bold text-white">3.8 Years</span>
            <span className="text-xs text-amber-300 font-semibold">(Month 45)</span>
          </div>
          <span className="text-[10px] text-amber-300/80">Net Profit Inflection Milestone</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <span className="h-0.5 w-5 border-t-2 border-dashed border-rose-500" />
            Turnkey Initial Capex Baseline
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Cumulative Net Inflow
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-300">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            Inflection Crossing Point (3.8y)
          </span>
        </div>
      </div>

      {/* Line Chart Canvas */}
      <div className="relative h-[320px] w-full">
        <Line data={chartData} options={chartOptions} />
      </div>
    </section>
  );
}
