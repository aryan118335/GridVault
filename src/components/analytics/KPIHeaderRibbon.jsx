import React from 'react';
import { Activity, BatteryCharging, CheckCircle2, FileDown, RefreshCw, Zap } from 'lucide-react';

/**
 * KPIHeaderRibbon
 * Top header ribbon for the Analytics & Financial Reports dashboard workspace.
 * Displays grid interconnect status, active tariff model, battery capacity,
 * and a trigger for the Custom PDF Report Builder.
 */
export default function KPIHeaderRibbon({ lastSynced = 'Just now', onRefresh, onOpenBuilder }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-lg lg:flex-row lg:items-center lg:justify-between">
      {/* Title & Live Status Indicator */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 text-slate-950 shadow-[0_0_20px_rgba(20,184,166,0.35)]">
            <Zap className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Analytics &amp; Financial Reports
            </h1>
            <p className="text-xs text-slate-400">
              GridVault ESS ROI Engine • Arbitrage Economics &amp; Regulatory Compliance
            </p>
          </div>
        </div>
      </div>

      {/* KPI Ribbon Badges & Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Custom Report Builder Trigger Button */}
        {onOpenBuilder && (
          <button
            type="button"
            onClick={onOpenBuilder}
            className="flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-teal-300 shadow-[0_0_16px_rgba(20,184,166,0.2)] transition-all hover:border-teal-400 hover:from-teal-500/30 hover:to-emerald-500/30 hover:text-white"
          >
            <FileDown className="h-3.5 w-3.5 stroke-[2.2]" />
            <span>Custom Report Builder</span>
          </button>
        )}

        {/* Interconnect Telemetry State */}
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-semibold">Substation Interconnect Active</span>
        </div>

        {/* Dynamic Tariff Badge */}
        <div className="hidden items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 sm:flex">
          <Activity className="h-3.5 w-3.5 text-teal-400" />
          <span>TOU Tier-3 Tariff</span>
        </div>

        {/* Battery Capacity Badge */}
        <div className="hidden items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 md:flex">
          <BatteryCharging className="h-3.5 w-3.5 text-emerald-400" />
          <span className="font-mono">14.8 MWh LFP</span>
        </div>

        {/* Manual Refresh Trigger */}
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700 hover:text-white"
          title="Refresh analytics data"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Synced: {lastSynced}</span>
        </button>
      </div>
    </div>
  );
}
