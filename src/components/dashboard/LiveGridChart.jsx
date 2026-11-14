import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { AlertCircle, Loader2, Radio, RefreshCw } from 'lucide-react';

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

function toSafeNumber(val, fallback = 0) {
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

function mapApiRowToPoint(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    id: row.id ?? null,
    label: formatTimeLabel(row.recorded_at),
    solar: toSafeNumber(row.solar_mw, 0),
    wind: toSafeNumber(row.wind_mw, 0),
    demand: toSafeNumber(row.demand_mw, 0),
    netBalance: toSafeNumber(row.net_balance_mw, 0),
    frequency: toSafeNumber(row.grid_frequency_hz, 50.0),
    status: row.grid_status || 'BALANCED',
  };
}

const POLL_INTERVAL_MS = 10000;

export default function LiveGridChart({ onDataUpdate }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const onDataUpdateRef = useRef(onDataUpdate);

  useEffect(() => {
    onDataUpdateRef.current = onDataUpdate;
  }, [onDataUpdate]);

  const fetchLiveTelemetry = useCallback(async (signal) => {
    try {
      const res = await fetch('/api/grid/live', { signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      const mapped = Array.isArray(json?.data)
        ? json.data.map(mapApiRowToPoint).filter(Boolean)
        : [];
      setPoints(mapped);
      setError(null);
      setLastSyncedAt(new Date());
      if (mapped.length > 0) {
        onDataUpdateRef.current?.(mapped[mapped.length - 1], mapped);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Unable to load live grid telemetry');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchLiveTelemetry(controller.signal);

    const timer = setInterval(() => {
      fetchLiveTelemetry(controller.signal);
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [fetchLiveTelemetry]);

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
            <Radio className={`h-3 w-3 ${error ? 'text-rose-400' : 'text-emerald-400 animate-pulse'}`} />
            {error ? 'Offline' : lastSyncedAt ? `10s Poll • ${formatTimeLabel(lastSyncedAt)}` : 'Live 10s'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Live telemetry stream error: {error}
          </span>
          <button
            type="button"
            onClick={() => fetchLiveTelemetry()}
            className="inline-flex items-center gap-1 rounded bg-rose-500/20 px-2 py-1 font-medium text-rose-200 hover:bg-rose-500/30"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      <div className="relative h-[320px] w-full">
        {loading && points.length === 0 ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
            Loading live grid telemetry...
          </div>
        ) : points.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 text-center text-sm text-slate-400">
            <p className="font-medium text-slate-300">No live grid telemetry available yet</p>
            <p className="text-xs text-slate-500">
              Waiting for /api/grid/live readings from PostgreSQL.
            </p>
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </section>
  );
}
