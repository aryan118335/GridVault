import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  Clock,
  Filter,
  Layers,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';

const PRESETS = [
  { id: '7D', label: 'Last 7 Days', startDate: '2026-11-11', endDate: '2026-11-18', span: 'Nov 11 – Nov 18, 2026' },
  { id: '30D', label: 'Last 30 Days', startDate: '2026-10-19', endDate: '2026-11-18', span: 'Oct 19 – Nov 18, 2026' },
  { id: 'MTD', label: 'Month to Date', startDate: '2026-11-01', endDate: '2026-11-18', span: 'Nov 01 – Nov 18, 2026' },
  { id: 'YTD', label: 'Year to Date', startDate: '2026-01-01', endDate: '2026-11-18', span: 'Jan 01 – Nov 18, 2026' },
];

const AGGREGATION_OPTIONS = [
  { id: '1h', label: '1-Hour Rollup' },
  { id: '1d', label: 'Daily Aggregation' },
  { id: '1w', label: 'Weekly Average' },
  { id: '1m', label: 'Monthly Summary' },
];

/**
 * DateRangeSelector
 * Nov 10 Milestone: Custom calendar range picker with presets (Last 7 Days, Month to Date, Year to Date)
 * and analytical aggregation interval filters (1h, 1d, 1w, 1m) for filtering all financial and compliance reports.
 */
export default function DateRangeSelector({
  selectedRange = '30D',
  aggregation = '1d',
  onRangeChange,
  onAggregationChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState('2026-10-19');
  const [endDate, setEndDate] = useState('2026-11-18');
  const [activePreset, setActivePreset] = useState(selectedRange);
  const [activeAgg, setActiveAgg] = useState(aggregation);
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Current active label
  const currentPreset = PRESETS.find((p) => p.id === activePreset);
  const displaySpan = currentPreset ? currentPreset.span : `${startDate} – ${endDate}`;

  const handleSelectPreset = (preset) => {
    setActivePreset(preset.id);
    setStartDate(preset.startDate);
    setEndDate(preset.endDate);
    onRangeChange?.(preset.id, { start: preset.startDate, end: preset.endDate });
  };

  const handleApplyCustom = () => {
    setActivePreset('CUSTOM');
    onRangeChange?.('CUSTOM', { start: startDate, end: endDate });
    onAggregationChange?.(activeAgg);
    setIsOpen(false);
  };

  const handleReset = () => {
    const defaultPreset = PRESETS[1]; // 30D
    setActivePreset('30D');
    setStartDate(defaultPreset.startDate);
    setEndDate(defaultPreset.endDate);
    setActiveAgg('1d');
    onRangeChange?.('30D', { start: defaultPreset.startDate, end: defaultPreset.endDate });
    onAggregationChange?.('1d');
    setIsOpen(false);
  };

  return (
    <div className="relative inline-flex items-center gap-2" ref={popoverRef}>
      {/* Quick Preset Buttons Bar */}
      <div className="hidden items-center rounded-xl border border-slate-800 bg-slate-900/90 p-1 sm:flex">
        {PRESETS.map((preset) => {
          const isActive = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
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

      {/* Main Interactive Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
          isOpen || activePreset === 'CUSTOM'
            ? 'border-teal-500/50 bg-slate-900 text-teal-300 shadow-[0_0_16px_rgba(20,184,166,0.2)]'
            : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:text-white'
        }`}
        aria-expanded={isOpen}
      >
        <CalendarIcon className="h-3.5 w-3.5 text-teal-400" />
        <span className="font-mono">{displaySpan}</span>
        <span className="hidden font-mono text-[10px] text-slate-400 sm:inline">
          [{activeAgg.toUpperCase()}]
        </span>
        <ChevronDown
          className={`h-3 w-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-teal-400' : ''}`}
        />
      </button>

      {/* Custom Calendar & Aggregation Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-700 bg-slate-900/98 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-teal-400" />
              <span className="text-xs font-semibold text-white">Date Range &amp; Aggregation</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quick Presets Grid */}
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Filter Presets
            </span>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {PRESETS.map((preset) => {
                const isActive = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                      isActive
                        ? 'border border-teal-500/40 bg-teal-500/15 font-semibold text-teal-300'
                        : 'border border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isActive && <Check className="h-3 w-3 text-teal-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Inputs */}
          <div className="mt-4 space-y-2 border-t border-slate-800 pt-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Custom Range Boundaries
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActivePreset('CUSTOM');
                  }}
                  className="mt-0.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActivePreset('CUSTOM');
                  }}
                  className="mt-0.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* TimescaleDB Downsampling Aggregation Interval */}
          <div className="mt-4 space-y-2 border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Aggregation Interval
              </span>
              <span className="text-[10px] font-mono text-teal-400">TimescaleDB</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {AGGREGATION_OPTIONS.map((opt) => {
                const isActive = activeAgg === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setActiveAgg(opt.id)}
                    className={`rounded-lg px-2 py-1 text-left text-xs transition-colors ${
                      isActive
                        ? 'border border-teal-500/40 bg-teal-500/20 font-semibold text-teal-300'
                        : 'border border-slate-800 bg-slate-800/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>

            <button
              type="button"
              onClick={handleApplyCustom}
              className="rounded-xl bg-teal-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-md transition-colors hover:bg-teal-400"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
