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

const MAX_POINTS = 50;

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
      soc: 78,
    });
  }
  return initial;
}

export default function LiveGridChart({ onDataUpdate }) {
  const [points, setPoints] = useState(() => createInitialSeries());
  const [streamMode, setStreamMode] = useState('SIMULATED_1S'); // 'WS_LIVE' | 'SIMULATED_1S'
  const stepRef = useRef(25);
  const onDataUpdateRef = useRef(onDataUpdate);

  useEffect(() => {
    onDataUpdateRef.current = onDataUpdate;
  }, [onDataUpdate]);

  useEffect(() => {
    let fallbackTimer = null;
    let ws = null;
    let unmounted = false;

    const pushSample = (sample) => {
      setPoints((prev) => [...prev, sample].slice(-MAX_POINTS));
      onDataUpdateRef.current?.(sample);
    };

    const startSimulatedStream = () => {
      if (fallbackTimer || unmounted) return;
      setStreamMode('SIMULATED_1S');
      fallbackTimer = setInterval(() => {
        stepRef.current += 1;
        const s = stepRef.current * 0.32;
        const solar = Math.round(1482 + Math.sin(s) * 210 + (Math.random() - 0.5) * 45);
        const wind = Math.round(842 + Math.cos(s * 0.75) * 140 + (Math.random() - 0.5) * 35);
        const demand = Math.round(2910 + Math.sin(s * 0.5 + 1.2) * 220 + (Math.random() - 0.5) * 40);
        const soc = Math.min(100, Math.max(12, Math.round(78 + Math.sin(s * 0.12) * 4)));

        pushSample({
          label: formatSecondLabel(new Date()),
          solar: Math.max(0, solar),
          wind: Math.max(0, wind),
          demand: Math.max(0, demand),
          soc,
        });
      }, 1000);
    };

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (unmounted) return;
        setStreamMode('WS_LIVE');
        if (fallbackTimer) {
          clearInterval(fallbackTimer);
          fallbackTimer = null;
        }
      };

      ws.onmessage = (event) => {
        if (unmounted) return;
        try {
          const payload = JSON.parse(event.data);
          const solar = Number(payload.solar ?? payload.solarKw);
          const wind = Number(payload.wind ?? payload.windKw);
          const demand = Number(payload.demand ?? payload.cityDemandKw);
          if (Number.isFinite(solar) && Number.isFinite(wind) && Number.isFinite(demand)) {
            pushSample({
              label: payload.timestamp
                ? formatSecondLabel(new Date(payload.timestamp))
                : formatSecondLabel(new Date()),
              solar,
              wind,
              demand,
              soc: Number.isFinite(Number(payload.soc)) ? Number(payload.soc) : 78,
            });
          }
        } catch {
          // Ignore non-telemetry control messages
        }
      };

      ws.onerror = () => {
        startSimulatedStream();
      };

      ws.onclose = () => {
        startSimulatedStream();
      };
    } catch {
      startSimulatedStream();
    }

    return () => {
      unmounted = true;
      if (fallbackTimer) clearInterval(fallbackTimer);
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
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
      animation: {
        duration: 240,
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          borderColor: 'rgba(51, 65, 85, 0.9)',
          borderWidth: 1,
          titleColor: '#94A3B8',
          bodyColor: '#F8FAFC',
          padding: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString()} MW`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(148, 163, 184, 0.08)',
          },
          ticks: {
            color: '#64748B',
            maxTicksLimit: 8,
            font: { family: 'ui-monospace, monospace', size: 11 },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(148, 163, 184, 0.10)',
          },
          ticks: {
            color: '#64748B',
            font: { family: 'ui-monospace, monospace', size: 11 },
            callback: (val) => `${val}`,
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
            Live 50-second rolling ECG feed (Solar vs Wind vs City Demand)
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
            <Radio
              className={`h-3 w-3 ${
                streamMode === 'WS_LIVE' ? 'text-emerald-400' : 'text-teal-400'
              }`}
            />
            {streamMode === 'WS_LIVE' ? 'WS Live' : 'Last 50s'}
          </span>
        </div>
      </div>

      <div className="relative h-[320px] w-full">
        <Line data={chartData} options={chartOptions} />
      </div>
    </section>
  );
}
