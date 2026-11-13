import React, { useEffect, useState } from "react";

/**
 * BatteryStatusWidget – bottom‑panel card that shows live battery information.
 * It fetches the current battery state from the backend (e.g., /api/battery/status)
 * and updates the UI accordingly.
 */
const BatteryStatusWidget = () => {
  // Battery data shape expected from the API
  // { charge_percent: number, is_discharging: boolean, power_mw: number }
  const [battery, setBattery] = useState({
    charge_percent: 0,
    is_discharging: false,
    power_mw: 0,
    loading: true,
  });

  // -----------------------------------------------------------------
  // Fetch battery status – you can replace the URL with your actual endpoint.
  // -----------------------------------------------------------------
  const fetchBattery = async () => {
    try {
      const resp = await fetch("/api/battery/status");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setBattery({
        charge_percent: data.charge_percent ?? 0,
        is_discharging: data.is_discharging ?? false,
        power_mw: data.power_mw ?? 0,
        loading: false,
      });
    } catch (err) {
      console.error("Failed to fetch battery status:", err);
      setBattery((prev) => ({ ...prev, loading: false }));
    }
  };

  // Initial fetch on mount; you could also add polling if desired.
  useEffect(() => {
    fetchBattery();
  }, []);

  // -----------------------------------------------------------------
  // Render UI
  // -----------------------------------------------------------------
  const { charge_percent, is_discharging, power_mw, loading } = battery;

  return (
    <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-between">
      {/* Charge percentage */}
      <div className="text-slate-100 font-medium">
        Battery Charge: <span className="font-bold">{loading ? "‑" : `${charge_percent}%`}</span>
      </div>

      {/* Status badge */}
      <div
        className={`
          px-3 py-1 rounded-full text-sm font-semibold text-white
          ${is_discharging ? "bg-red-600 animate-pulse" : "bg-green-600"}
        `}
      >
        {loading
          ? "Loading…"
          : is_discharging
          ? `DISCHARGING (${power_mw} MW)`
          : `CHARGING (${power_mw} MW)`}
      </div>
    </div>
  );
};

export default BatteryStatusWidget;
