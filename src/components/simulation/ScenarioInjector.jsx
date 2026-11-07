import React, { useState } from 'react';

/**
 * ScenarioInjector – Left control panel for real-time dispatch scenario injection.
 * Provides interactive sliders for Solar Output & City Demand targets,
 * an 'Apply Grid Override' button, and an emergency 'Simulate Heavy Rain' trigger.
 */
const ScenarioInjector = ({ onSimulationComplete }) => {
  const [solarOutput, setSolarOutput] = useState(50);
  const [cityDemand, setCityDemand] = useState(80);
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  // -----------------------------------------------------------------
  // POST /api/simulate/override - Apply operator slider targets
  // -----------------------------------------------------------------
  const handleApplyOverride = async () => {
    setLoading(true);
    setLastAction(null);
    try {
      const response = await fetch('/api/simulate/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solarOutput: Number(solarOutput),
          cityDemand: Number(cityDemand),
        }),
      });

      if (!response.ok) {
        throw new Error(`Override request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setLastAction({
        type: 'OVERRIDE',
        text: `Grid override applied: ${data.battery?.mode} (${data.log?.power_mw} MW)`,
        mode: data.battery?.mode,
      });

      if (onSimulationComplete) {
        onSimulationComplete(data);
      }
    } catch (err) {
      console.error('[ScenarioInjector] Override error:', err);
      setLastAction({
        type: 'ERROR',
        text: `Error: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------
  // POST /api/simulate/heavy-rain - Emergency monsoon cloudburst simulation
  // -----------------------------------------------------------------
  const handleHeavyRain = async () => {
    setLoading(true);
    setLastAction(null);
    try {
      const response = await fetch('/api/simulate/heavy-rain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solarOutput: Number(solarOutput),
          cityDemand: Number(cityDemand),
        }),
      });

      if (!response.ok) {
        throw new Error(`Heavy rain simulation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setLastAction({
        type: 'HEAVY_RAIN',
        text: `Torrential Rain: Solar cut 75% -> Battery ${data.battery?.mode} (${data.log?.power_mw} MW)`,
        mode: data.battery?.mode,
      });

      if (onSimulationComplete) {
        onSimulationComplete(data);
      }
    } catch (err) {
      console.error('[ScenarioInjector] Heavy rain error:', err);
      setLastAction({
        type: 'ERROR',
        text: `Error: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700/60 p-5 rounded-xl shadow-lg space-y-6">
      <div className="border-b border-slate-700/70 pb-3">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          Scenario Injector
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Adjust grid generation and municipal load parameters
        </p>
      </div>

      {/* Slider: Target Solar Output */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-slate-300">Target Solar Output</label>
          <span className="text-sm font-bold text-amber-400 font-mono bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
            {solarOutput} MW
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="200"
          step="5"
          value={solarOutput}
          onChange={(e) => setSolarOutput(Number(e.target.value))}
          disabled={loading}
          className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
        />
        <div className="flex justify-between text-[11px] text-slate-500 mt-1">
          <span>0 MW (Night/Rain)</span>
          <span>100 MW</span>
          <span>200 MW (Peak Sun)</span>
        </div>
      </div>

      {/* Slider: Target City Demand */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-slate-300">Target City Demand</label>
          <span className="text-sm font-bold text-cyan-400 font-mono bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
            {cityDemand} MW
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="300"
          step="5"
          value={cityDemand}
          onChange={(e) => setCityDemand(Number(e.target.value))}
          disabled={loading}
          className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
        />
        <div className="flex justify-between text-[11px] text-slate-500 mt-1">
          <span>0 MW (Off-Peak)</span>
          <span>150 MW</span>
          <span>300 MW (Super-Peak)</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleApplyOverride}
          disabled={loading}
          className="w-full bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-150 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            'Apply Grid Override'
          )}
        </button>

        <button
          type="button"
          onClick={handleHeavyRain}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-150 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🌧️ Simulate Heavy Rain (-75% Solar)
        </button>
      </div>

      {/* Live Feedback Toast/Banner */}
      {lastAction && (
        <div
          className={`p-3 rounded-lg text-xs font-mono border ${
            lastAction.type === 'ERROR'
              ? 'bg-red-950/70 border-red-800 text-red-300'
              : lastAction.type === 'HEAVY_RAIN'
              ? 'bg-amber-950/70 border-amber-800 text-amber-300'
              : 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
          }`}
        >
          <span className="font-bold">STATUS:</span> {lastAction.text}
        </div>
      )}
    </div>
  );
};

export default ScenarioInjector;
