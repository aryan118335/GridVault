import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Radio } from 'lucide-react';

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

function formatTimeLabel(isoOrDate) {
  const date = new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function mapApiRowToPoint(row) {
  return {
    id: row.id,
    label: formatTimeLabel(row.recorded_at),
    solar: Number(row.solar_mw),
    wind: Number(row.wind_mw),
    demand: Number(row.demand_mw),
    netBalance: Number(row.net_balance_mw),
    frequency: Number(row.grid_frequency_hz),
    status: row.grid_status,
  };
}

export default function LiveGridChart({ onDataUpdate }) {
  const [points, setPoints] = useState([]);
  const onDataUpdateRef = useRef(onDataUpdate);

  useEffect(() => {
    onDataUpdateRef.current = onDataUpdate;
  }, [onDataUpdate]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialLiveGrid() {
      try {
        const res = await fetch('/api/grid/live', { signal: controller.signal });
        if (!res.ok) return;
        const json = await res.json();
        const mapped = Array.isArray(json.data) ? json.data.map(mapApiRowToPoint) : [];
        setPoints(mapped);
        if (mapped.length > 0) {
          onDataUpdateRef.current?.(mapped[mapped.length - 1], mapped);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[LiveGridChart] Failed to fetch /api/grid/live:', err.message);
        }
      }
    }

    loadInitialLiveGrid();
    return () => controller.abort();
  }, []);

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
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#F59E0B',
          pointHoverBorderColor: '#0F172A',
          pointHoverBorderWidth: 2,
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
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#14B8A6',
          pointHoverBorderColor: '#0F172A',
          pointHoverBorderWidth: 2,
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
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#F43F5E',
          pointHoverBorderColor: '#0F172A',
          pointHoverBorderWidth: 2,
        },
      ],
    }),
    [points]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 240 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          borderColor: 'rgba(51, 65, 85, 0.9)',
          borderWidth: 1,
          titleColor: '#94A3B8',
          bodyColor: '#F8FAFC',
          padding: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.parsed.y).toFixed(1)} MW`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(148, 163, 184, 0.08)' },
          ticks: {
            color: '#64748B',
            maxTicksLimit: 8,
            font: { family: 'ui-monospace, monospace', size: 11 },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, 0.10)' },
          ticks: {
            color: '#64748B',
            font: { family: 'ui-monospace, monospace', size: 11 },
          },
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
          <p className="text-xs text-slate-400">
            Live PostgreSQL telemetry from /api/grid/live (Solar vs Wind vs City Demand)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-3">
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

          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-2.5 py-1 font-mono text-[11px] text-slate-300">
            <Radio className="h-3 w-3 text-emerald-400" />
            API Live
          </span>
        </div>
      </div>

      <div className="relative h-[320px] w-full">
        <Line data={chartData} options={chartOptions} />
      </div>
    </section>
  );
}
