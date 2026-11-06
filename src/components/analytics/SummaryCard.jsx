import React from 'react';
import ExecutiveTrendBadge from './ExecutiveTrendBadge.jsx';

const THEMES = {
  emerald: {
    border: 'border-emerald-500/40 hover:border-emerald-400/80',
    glow: 'shadow-[0_0_30px_-5px_rgba(16,185,129,0.28)] hover:shadow-[0_0_38px_-4px_rgba(16,185,129,0.42)]',
    iconWrap:
      'border-emerald-400/40 bg-emerald-500/15 text-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.3)]',
    valueColor: 'text-white',
    highlightBar: 'from-emerald-400 to-teal-500',
  },
  cyan: {
    border: 'border-cyan-500/40 hover:border-cyan-400/80',
    glow: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.28)] hover:shadow-[0_0_38px_-4px_rgba(6,182,212,0.42)]',
    iconWrap:
      'border-cyan-400/40 bg-cyan-500/15 text-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.3)]',
    valueColor: 'text-white',
    highlightBar: 'from-cyan-400 to-sky-500',
  },
  amber: {
    border: 'border-amber-500/40 hover:border-amber-400/80',
    glow: 'shadow-[0_0_30px_-5px_rgba(245,158,11,0.28)] hover:shadow-[0_0_38px_-4px_rgba(245,158,11,0.42)]',
    iconWrap:
      'border-amber-400/40 bg-amber-500/15 text-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.3)]',
    valueColor: 'text-white',
    highlightBar: 'from-amber-400 to-yellow-500',
  },
  violet: {
    border: 'border-violet-500/40 hover:border-violet-400/80',
    glow: 'shadow-[0_0_30px_-5px_rgba(139,92,246,0.28)] hover:shadow-[0_0_38px_-4px_rgba(139,92,246,0.42)]',
    iconWrap:
      'border-violet-400/40 bg-violet-500/15 text-violet-400 shadow-[0_0_18px_rgba(139,92,246,0.3)]',
    valueColor: 'text-white',
    highlightBar: 'from-violet-400 to-indigo-500',
  },
};

/**
 * SummaryCard (Base Executive Card Wrapper)
 * Features dark slate theme, customizable glowing box-shadows,
 * large bold typography (text-4xl font-bold), and an icon badge.
 */
export default function SummaryCard({
  title,
  value,
  trend,
  subtitle,
  icon: Icon,
  variant = 'emerald', // 'emerald' | 'cyan' | 'amber' | 'violet'
}) {
  const theme = THEMES[variant] || THEMES.emerald;

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border bg-slate-800/90 p-6 backdrop-blur-sm transition-all duration-300 ${theme.border} ${theme.glow}`}
    >
      {/* Top subtle gradient highlight bar */}
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.highlightBar}`}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-4">
        {/* Title and Meta */}
        <div className="space-y-1">
          <p className="text-sm font-semibold tracking-wide text-slate-300 uppercase">
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400">{subtitle}</p>
          )}
        </div>

        {/* Icon Badge */}
        {Icon && (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 hover:scale-105 ${theme.iconWrap}`}
          >
            <Icon className="h-6 w-6 stroke-[2.2]" />
          </div>
        )}
      </div>

      {/* Primary Highlight Metric: text-4xl font-bold for judges presentation */}
      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <span className={`font-mono text-4xl font-bold tracking-tight ${theme.valueColor}`}>
          {value}
        </span>
      </div>

      {/* Trend Indicator pill */}
      {trend && (
        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-700/60">
          <ExecutiveTrendBadge trend={trend} variant={variant} />
        </div>
      )}
    </article>
  );
}
