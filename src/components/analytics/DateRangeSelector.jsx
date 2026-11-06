import React from 'react';
import { Calendar } from 'lucide-react';

const RANGE_PRESETS = [
  { id: '7D', label: 'Last 7 Days', dateSpan: 'Nov 11 – Nov 18, 2026' },
  { id: '30D', label: 'Last 30 Days', dateSpan: 'Oct 19 – Nov 18, 2026' },
  { id: 'MTD', label: 'Month to Date', dateSpan: 'Nov 01 – Nov 18, 2026' },
  { id: 'YTD', label: 'Year to Date', dateSpan: 'Jan 01 – Nov 18, 2026' },
];

/**
 * DateRangeSelector
 * Date range selector bar with quick presets for filtering financial and compliance reports.
 */
export default function DateRangeSelector({ selectedRange = '30D', onRangeChange }) {
  const current = RANGE_PRESETS.find((r) => r.id === selectedRange) || RANGE_PRESETS[1];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2">
      {/* Date display with Calendar icon */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Calendar className="h-3.5 w-3.5 text-teal-400" />
        <span className="font-mono text-slate-300">{current.dateSpan}</span>
      </div>

      {/* Preset range buttons */}
      <div className="flex items-center gap-1">
        {RANGE_PRESETS.map((preset) => {
          const isActive = selectedRange === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onRangeChange?.(preset.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                isActive
                  ? 'border border-teal-500/40 bg-teal-500/20 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.25)]'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
