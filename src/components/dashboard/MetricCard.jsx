import { MoreVertical, Sun, Wind, Zap } from 'lucide-react';

const TYPE_STYLES = {
  solar: {
    Icon: Sun,
    cardGlow:
      'border-amber-400/35 shadow-[0_0_26px_-4px_rgba(250,204,21,0.28)] hover:border-amber-400/60',
    iconWrap:
      'border-amber-400/35 bg-amber-500/15 text-amber-400 shadow-[0_0_16px_rgba(250,204,21,0.25)]',
    trendColor: 'text-emerald-400',
    stroke: '#F59E0B',
  },
  wind: {
    Icon: Wind,
    cardGlow:
      'border-teal-400/35 shadow-[0_0_26px_-4px_rgba(20,184,166,0.28)] hover:border-teal-400/60',
    iconWrap:
      'border-teal-400/35 bg-teal-500/15 text-teal-400 shadow-[0_0_16px_rgba(20,184,166,0.25)]',
    trendColor: 'text-slate-400',
    stroke: '#14B8A6',
  },
  demand: {
    Icon: Zap,
    cardGlow:
      'border-rose-500/35 shadow-[0_0_26px_-4px_rgba(244,63,94,0.28)] hover:border-rose-500/60',
    iconWrap:
      'border-rose-500/35 bg-rose-500/15 text-rose-400 shadow-[0_0_16px_rgba(244,63,94,0.25)]',
    trendColor: 'text-rose-400',
    stroke: '#F43F5E',
  },
};

function buildSparklinePoints(values = []) {
  if (values.length < 2) return '0,20 72,20';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  return values
    .map((val, idx) => {
      const x = (idx / (values.length - 1)) * 72;
      const y = 26 - ((val - min) / span) * 20;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export default function MetricCard({
  title,
  value,
  unit = 'MW',
  trend,
  type = 'solar',
  sparkline = [],
}) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.solar;
  const { Icon } = style;

  const formattedValue =
    typeof value === 'number' ? Math.round(value).toLocaleString('en-US') : value;
  const polyPoints = buildSparklinePoints(sparkline);

  return (
    <div
      className={`relative flex items-center justify-between gap-4 rounded-2xl border bg-slate-800/90 p-5 transition-all duration-200 ${style.cardGlow}`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border ${style.iconWrap}`}
        >
          <Icon className="h-7 w-7" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-300">{title}</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {formattedValue}
            </span>
            <span className="text-base font-medium text-slate-300">{unit}</span>
          </div>
          <p className={`mt-1 truncate text-xs font-medium ${style.trendColor}`}>{trend}</p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between self-stretch">
        <button
          type="button"
          className="rounded p-1 text-slate-400 hover:bg-slate-700/60 hover:text-white"
          aria-label={`${title} options`}
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        <svg width="72" height="30" viewBox="0 0 72 30" className="overflow-visible">
          <polyline
            fill="none"
            stroke={style.stroke}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polyPoints}
          />
        </svg>
      </div>
    </div>
  );
}
