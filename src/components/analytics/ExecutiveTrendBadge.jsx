import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

/**
 * Component 4 of 22: ExecutiveTrendBadge
 * Renders a compact, high-contrast trend pill with directional icons.
 * Parses percentage changes and assigns contextual colors.
 */
export default function ExecutiveTrendBadge({ trend, variant = 'emerald' }) {
  if (!trend) return null;

  const trendStr = String(trend).trim();
  const isPositive = trendStr.startsWith('+');
  const isNegative = trendStr.startsWith('-');

  let Icon = Minus;
  let colorClasses = 'border-slate-700 bg-slate-900/60 text-slate-300';

  if (isPositive) {
    Icon = ArrowUpRight;
    colorClasses =
      variant === 'emerald'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
        : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400';
  } else if (isNegative) {
    Icon = ArrowDownRight;
    colorClasses = 'border-rose-500/30 bg-rose-500/10 text-rose-400';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold font-mono tracking-tight ${colorClasses}`}
    >
      <Icon className="h-3.5 w-3.5 stroke-[2.4]" />
      <span>{trendStr}</span>
    </span>
  );
}
