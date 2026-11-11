import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import MetricCard from '../components/dashboard/MetricCard.jsx';
import LiveGridChart from '../components/dashboard/LiveGridChart.jsx';
import BatteryGauge from '../components/dashboard/BatteryGauge.jsx';

const SUMMARY_POLL_MS = 10000;

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [batteryOverride, setBatteryOverride] = useState(null);

  const [summary, setSummary] = useState({
    solar: null,
    wind: null,
    demand: null,
    netBalance: null,
    gridStatus: 'BALANCED',
    frequencyHz: 50.0,
    peakDemandMw: null,
    avgRenewableMw: null,
    renewableSharePct: null,
    solarDeltaPct: null,
    windDeltaPct: null,
    soc: 78,
    solarSparkline: [],
    windSparkline: [],
    demandSparkline: [],
  });

  useEffect(() => {
    const controller = new AbortController();

    async function fetchGridSummary() {
      try {
        const res = await fetch('/api/grid/summary', { signal: controller.signal });
        if (!res.ok) return;
        const json = await res.json();
        const latest = json?.latest;
        const agg = json?.aggregates_24h;
        const sparks = json?.sparklines;

        if (!latest) return;

        setSummary((prev) => ({
          ...prev,
          solar: latest.solar_mw,
          wind: latest.wind_mw,
          demand: latest.demand_mw,
          netBalance: latest.net_balance_mw,
          gridStatus: latest.grid_status || 'BALANCED',
          frequencyHz: agg?.current_frequency_hz ?? latest.grid_frequency_hz ?? prev.frequencyHz,
          peakDemandMw: agg?.peak_demand_mw ?? prev.peakDemandMw,
          avgRenewableMw: agg?.avg_renewable_mw ?? prev.avgRenewableMw,
          renewableSharePct: agg?.renewable_share_pct ?? prev.renewableSharePct,
          solarDeltaPct: agg?.solar_delta_pct ?? null,
          windDeltaPct: agg?.wind_delta_pct ?? null,
          solarSparkline: Array.isArray(sparks?.solar) ? sparks.solar : prev.solarSparkline,
          windSparkline: Array.isArray(sparks?.wind) ? sparks.wind : prev.windSparkline,
          demandSparkline: Array.isArray(sparks?.demand) ? sparks.demand : prev.demandSparkline,
        }));
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[DashboardPage] Failed to fetch /api/grid/summary:', err.message);
        }
      }
    }

    fetchGridSummary();
    const timer = setInterval(fetchGridSummary, SUMMARY_POLL_MS);

    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, []);

  const handleDataUpdate = useCallback((latestTick, allPoints) => {
    if (!latestTick) return;
    setSummary((prev) => ({
      ...prev,
      solar: latestTick.solar,
      wind: latestTick.wind,
      demand: latestTick.demand,
      netBalance: latestTick.netBalance ?? prev.netBalance,
      gridStatus: latestTick.status ?? prev.gridStatus,
      frequencyHz: latestTick.frequency ?? prev.frequencyHz,
      solarSparkline:
        Array.isArray(allPoints) && allPoints.length > 0
          ? allPoints.slice(-12).map((p) => p.solar)
          : prev.solarSparkline,
      windSparkline:
        Array.isArray(allPoints) && allPoints.length > 0
          ? allPoints.slice(-12).map((p) => p.wind)
          : prev.windSparkline,
      demandSparkline:
        Array.isArray(allPoints) && allPoints.length > 0
          ? allPoints.slice(-12).map((p) => p.demand)
          : prev.demandSparkline,
    }));
  }, []);

  const displayedSoc = batteryOverride !== null ? batteryOverride : summary.soc;

  const matchesSearch = (label) => {
    if (!searchQuery.trim()) return true;
    return label.toLowerCase().includes(searchQuery.trim().toLowerCase());
  };

  return (
    <DashboardLayout searchQuery={searchQuery} onSearchChange={setSearchQuery}>
      <div className="space-y-5">
        {/* Top Row: 3 Reusable Metric Cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {matchesSearch('Solar Generation') && (
            <MetricCard
              title="Solar Generation"
              value={summary.solar}
              unit="MW"
              trend={
                summary.renewableSharePct !== null
                  ? `Renewable share: ${summary.renewableSharePct}%`
                  : '24h solar output'
              }
              deltaPct={summary.solarDeltaPct}
              statusBadge={summary.gridStatus}
              type="solar"
              sparkline={summary.solarSparkline}
            />
          )}

          {matchesSearch('Wind Generation') && (
            <MetricCard
              title="Wind Generation"
              value={summary.wind}
              unit="MW"
              trend={
                summary.avgRenewableMw !== null
                  ? `24h avg renewables: ${summary.avgRenewableMw} MW`
                  : 'Live wind feed'
              }
              deltaPct={summary.windDeltaPct}
              statusBadge={summary.frequencyHz ? `${Number(summary.frequencyHz).toFixed(2)} Hz` : null}
              type="wind"
              sparkline={summary.windSparkline}
            />
          )}

          {matchesSearch('City Power Demand') && (
            <MetricCard
              title="City Power Demand"
              value={summary.demand}
              unit="MW"
              trend={
                summary.peakDemandMw !== null
                  ? `24h peak: ${summary.peakDemandMw} MW`
                  : summary.gridStatus === 'DEFICIT'
                    ? 'High demand'
                    : 'Normal load'
              }
              statusBadge={summary.gridStatus}
              type="demand"
              sparkline={summary.demandSparkline}
            />
          )}
        </div>

        {/* Lower Split Grid: Live Chart.js Line Stream (Left) + Battery Gauge (Right) */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <LiveGridChart onDataUpdate={handleDataUpdate} />
          </div>

          <div className="lg:col-span-4">
            <BatteryGauge
              soc={displayedSoc}
              capacityMwh={14.8}
              chargingStatus={summary.gridStatus === 'SURPLUS' ? 'Charging' : 'Discharging'}
              timeToFull="2h 15m"
              overrideSoc={batteryOverride}
              onSelectOverride={setBatteryOverride}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
