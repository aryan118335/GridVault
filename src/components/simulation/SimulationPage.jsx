import React, { useState, useCallback } from 'react';
import DashboardLayout from '../layout/DashboardLayout.jsx';
import ScenarioInjector from './ScenarioInjector.jsx';
import LiveActionFeed from './LiveActionFeed.jsx';
import BatteryStatusWidget from './BatteryStatusWidget.jsx';

/**
 * SimulationPage – Master wrapper for the GridVault real-time dispatch simulation room.
 * Integrates:
 *   - ScenarioInjector (Left control panel)
 *   - LiveActionFeed (Right terminal telemetry feed)
 *   - BatteryStatusWidget (Bottom status & state-of-charge card)
 * All wrapped inside DashboardLayout with project global dark theme.
 */
const SimulationPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Triggered whenever a slider override or heavy rain event completes
  const handleSimulationComplete = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
              <span>⚡</span> Real-Time Dispatch Control Room
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Autonomous BESS dispatch algorithm testing, grid balancing, and weather stress simulation
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            DISPATCH ENGINE ONLINE
          </div>
        </div>

        {/* Main Simulation Grid: Left Controls (1/3) + Right Terminal Feed (2/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5">
            <ScenarioInjector onSimulationComplete={handleSimulationComplete} />
          </div>

          <div className="lg:col-span-7">
            <LiveActionFeed refreshTrigger={refreshKey} />
          </div>
        </div>

        {/* Bottom Full-Width Battery Status Widget */}
        <div>
          <BatteryStatusWidget refreshTrigger={refreshKey} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SimulationPage;
