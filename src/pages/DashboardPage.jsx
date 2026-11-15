import { useCallback, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import MetricCard from '../components/dashboard/MetricCard.jsx';
import LiveGridChart from '../components/dashboard/LiveGridChart.jsx';
import BatteryGauge from '../components/dashboard/BatteryGauge.jsx';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [batteryOverride, setBatteryOverride] = useState(null);

  const [metrics, setMetrics] = useState({
    solar: 1482,
    wind: 842,
    demand: 2910,
    soc: 78,
    solarSparkline: [1320, 1380, 1410, 1395, 1445, 1468, 1482],
    windSparkline: [890, 865, 872, 850, 860, 838, 842],
    demandSparkline: [2720, 2765, 2810, 2845, 2875, 2890, 2910],
  });

  const handleDataUpdate = useCallback((tick) => {
    setMetrics((prev) => ({
      solar: tick.solar,
      wind: tick.wind,
      demand: tick.demand,
      soc: tick.soc ?? prev.soc,
      solarSparkline: [...prev.solarSparkline, tick.solar].slice(-12),
      windSparkline: [...prev.windSparkline, tick.wind].slice(-12),
      demandSparkline: [...prev.demandSparkline, tick.demand].slice(-12),
    }));
  }, []);

  const displayedSoc = batteryOverride !== null ? batteryOverride : metrics.soc;

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
              value={metrics.solar}
              unit="MW"
              trend="+12% vs last hr"
              type="solar"
              sparkline={metrics.solarSparkline}
            />
          )}

          {matchesSearch('Wind Generation') && (
            <MetricCard
              title="Wind Generation"
              value={metrics.wind}
              unit="MW"
              trend="-3% vs last hr"
              type="wind"
              sparkline={metrics.windSparkline}
            />
          )}

          {matchesSearch('City Power Demand') && (
            <MetricCard
              title="City Power Demand"
              value={metrics.demand}
              unit="MW"
              trend={metrics.demand > 2800 ? 'High demand' : 'Normal load'}
              type="demand"
              sparkline={metrics.demandSparkline}
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
              chargingStatus="Charging"
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
