import { MoreVertical, Sun, TrendingDown, TrendingUp, Wind, Zap } from 'lucide-react';

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

function getStatusBadgeStyle(badge) {
  if (!badge) return null;
  const upper = String(badge).toUpperCase();
  if (upper === 'SURPLUS') {
    return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300';
  }
  if (upper === 'DEFICIT') {
    return 'border-rose-500/40 bg-rose-500/15 text-rose-300';
  }
  if (upper === 'BALANCED') {
    return 'border-sky-400/40 bg-sky-500/15 text-sky-300';
  }
  return 'border-slate-600/70 bg-slate-900/70 text-slate-300';
}

function buildSparklinePoints(values = []) {
  const numeric = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (numeric.length < 2) return '0,20 72,20';
  const min = Math.min(...numeric);
  const max = Math.max(...numeric);
  const span = Math.max(1, max - min);
  return numeric
    .map((val, idx) => {
      const x = (idx / (numeric.length - 1)) * 72;
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
  deltaPct = null,
  statusBadge = null,
  type = 'solar',
  sparkline = [],
}) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.solar;
  const { Icon } = style;

  const formattedValue =
    typeof value === 'number' && Number.isFinite(value)
      ? value.toLocaleString('en-US', { maximumFractionDigits: 1 })
      : value ?? '--';

  const hasDelta = typeof deltaPct === 'number' && Number.isFinite(deltaPct);
  const badgeClasses = getStatusBadgeStyle(statusBadge);
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
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-slate-300">{title}</p>
            {statusBadge && badgeClasses && (
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${badgeClasses}`}
              >
                {statusBadge}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {formattedValue}
            </span>
            <span className="text-base font-medium text-slate-300">{unit}</span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium">
            {hasDelta && (
              <span
                className={`inline-flex items-center gap-0.5 font-mono ${
                  deltaPct > 0
                    ? 'text-emerald-400'
                    : deltaPct < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                }`}
              >
                {deltaPct >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`}
              </span>
            )}
            {trend && <p className={`truncate ${style.trendColor}`}>{trend}</p>}
          </div>
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
