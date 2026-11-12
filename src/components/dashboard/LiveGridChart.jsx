import { useMemo } from 'react';
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

function formatSecondLabel(date) {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function createInitialSeries() {
  const now = Date.now();
  const initial = [];
  for (let i = 24; i >= 0; i -= 1) {
    const t = new Date(now - i * 1000);
    const phase = (24 - i) * 0.35;
    initial.push({
      label: formatSecondLabel(t),
      solar: Math.round(1450 + Math.sin(phase) * 180),
      wind: Math.round(840 + Math.cos(phase * 0.8) * 110),
      demand: Math.round(2880 + Math.sin(phase * 0.5 + 1.1) * 190),
    });
  }
  return initial;
}

export default function LiveGridChart() {
  const points = useMemo(() => createInitialSeries(), []);

  const chartData = useMemo(
    () => ({
      labels: points.map((p) => p.label),
      datasets: [
        {
          label: 'Solar',
          data: points.map((p) => p.solar),
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.16)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointRadius: 0,
        },
        {
          label: 'Wind',
          data: points.map((p) => p.wind),
          borderColor: '#14B8A6',
          backgroundColor: 'rgba(20, 184, 166, 0.16)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointRadius: 0,
        },
        {
          label: 'City Demand',
          data: points.map((p) => p.demand),
          borderColor: '#F43F5E',
          backgroundColor: 'rgba(244, 63, 94, 0.16)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointRadius: 0,
        },
      ],
    }),
    [points]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { color: 'rgba(148, 163, 184, 0.08)' },
          ticks: { color: '#64748B', maxTicksLimit: 8 },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, 0.10)' },
          ticks: { color: '#64748B' },
        },
      },
    }),
    []
  );

  return (
    <section className="flex flex-col rounded-2xl border border-slate-700/80 bg-slate-800/90 p-5 shadow-lg">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Grid Power Performance</h2>
          <p className="text-xs text-slate-400">Solar vs Wind vs City Demand</p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Solar
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-400" /> Wind
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> City Demand
          </span>
        </div>
      </div>

      <div className="relative h-[320px] w-full">
        <Line data={chartData} options={chartOptions} />
      </div>
    </section>
  );
}
