import React, { useEffect, useState, useCallback } from 'react';

/**
 * BatteryStatusWidget – Bottom telemetry card visualizing the battery's live state of charge,
 * capacity, and dynamic operational mode badge (CHARGING, DISCHARGING, STANDBY).
 * Fetches GET /api/battery/status on mount and re-fetches immediately when refreshTrigger changes.
 */
const BatteryStatusWidget = ({ refreshTrigger }) => {
  const [battery, setBattery] = useState({
    charge_percent: 75.0,
    max_capacity_mw: 100.0,
    mode: 'STANDBY',
    power_mw: 0,
    is_discharging: false,
    updated_at: null,
    loading: true,
  });

  const fetchBatteryStatus = useCallback(async () => {
    try {
      const resp = await fetch('/api/battery/status');
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data = await resp.json();

      const mode = (data.mode || 'STANDBY').toUpperCase();
      const isDischarging = data.is_discharging ?? (mode === 'DISCHARGING');
      const powerMw = data.power_mw ? parseFloat(data.power_mw) : 0;
      const chargePercent = data.charge_percent !== undefined ? parseFloat(data.charge_percent) : 75.0;
      const maxCapacity = data.max_capacity_mw ? parseFloat(data.max_capacity_mw) : 100.0;

      setBattery({
        charge_percent: chargePercent,
        max_capacity_mw: maxCapacity,
        mode,
        power_mw: powerMw,
        is_discharging: isDischarging,
        updated_at: data.updated_at || new Date().toISOString(),
        loading: false,
      });
    } catch (err) {
      console.error('[BatteryStatusWidget] Error fetching battery status:', err);
      setBattery((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Fetch on mount and whenever parent simulation triggers an update
  useEffect(() => {
    fetchBatteryStatus();
  }, [fetchBatteryStatus, refreshTrigger]);

  const { charge_percent, max_capacity_mw, mode, power_mw, is_discharging, updated_at, loading } = battery;

  // Compute SOC color & progress width
  const socColor =
    charge_percent > 60
      ? 'bg-emerald-500'
      : charge_percent > 20
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <div className="bg-slate-800 border border-slate-700/60 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Battery Title & State of Charge */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700">
              <span className="text-xl">🔋</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-100">
                  {loading ? '...' : `${charge_percent.toFixed(1)}%`}
                </span>
                <span className="text-xs uppercase tracking-wider text-slate-400">
                  State of Charge (SOC)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Rated Capacity: <span className="font-mono text-slate-300 font-semibold">{maxCapacity_mw} MW</span>
                {updated_at && (
                  <span className="ml-3 text-slate-500">
                    Last sync: {new Date(updated_at).toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* SOC Progress Bar */}
          <div className="w-full bg-slate-900/90 rounded-full h-3 mt-3 border border-slate-700/60 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${socColor}`}
              style={{ width: `${Math.min(100, Math.max(0, charge_percent))}%` }}
            ></div>
          </div>
        </div>

        {/* Right: Mode Badge & Dispatched Power */}
        <div className="flex items-center gap-3 self-end md:self-center">
          {mode === 'CHARGING' ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-mono text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              CHARGING ({power_mw.toFixed(1)} MW)
            </div>
          ) : mode === 'DISCHARGING' || is_discharging ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/80 border border-red-700 text-red-300 font-mono text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              DISCHARGING ({power_mw.toFixed(1)} MW)
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/80 border border-slate-600 text-slate-300 font-mono text-sm font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              STANDBY (0.0 MW)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatteryStatusWidget;
