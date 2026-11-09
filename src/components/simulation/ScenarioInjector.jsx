import React, { useState } from "react";

// ScenarioInjector – left‑side control panel placeholder.
// Sliders, buttons and other controls will be added in later milestones.

const ScenarioInjector = () => {
  // Local state for the two sliders (default values are arbitrary)
  const [solarOutput, setSolarOutput] = useState(50);
  const [cityDemand, setCityDemand] = useState(80);

  // Click handler placeholder – will later call the backend API
  const handleHeavyRain = () => {
    // TODO: POST to /api/simulate/heavy‑rain
    console.log("Heavy Rain button clicked");
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg space-y-6">
      {/* Slider: Target Solar Output */}
      <div>
        <label className="block text-slate-100 font-medium mb-2">
          Target Solar Output ({solarOutput} MW)
        </label>
        <input
          type="range"
          min="0"
          max="200"
          step="5"
          value={solarOutput}
          onChange={(e) => setSolarOutput(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Slider: Target City Demand */}
      <div>
        <label className="block text-slate-100 font-medium mb-2">
          Target City Demand ({cityDemand} MW)
        </label>
        <input
          type="range"
          min="0"
          max="300"
          step="5"
          value={cityDemand}
          onChange={(e) => setCityDemand(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Heavy‑Rain button */}
      <div className="mt-4">
        <button
          type="button"
          onClick={handleHeavyRain}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Simulate Heavy Rain
        </button>
      </div>
    </div>
  );
};

export default ScenarioInjector;
