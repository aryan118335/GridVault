import React, { useState } from "react";

// ScenarioInjector – left‑side control panel.
const ScenarioInjector = () => {
  // Local state for the two sliders (default values are arbitrary)
  const [solarOutput, setSolarOutput] = useState(50);
  const [cityDemand, setCityDemand] = useState(80);

  // -----------------------------------------------------------------
  // POST request to trigger the heavy‑rain simulation on the backend.
  // -----------------------------------------------------------------
  const handleHeavyRain = async () => {
    try {
      const response = await fetch("/api/simulate/heavy-rain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Send the current slider values if the backend needs them
        body: JSON.stringify({ solarOutput, cityDemand }),
      });

      if (!response.ok) {
        console.error(
          `Heavy‑rain request failed: ${response.status} ${response.statusText}`
        );
        return;
      }

      const data = await response.json();
      console.log("Heavy‑rain simulation started:", data);
    } catch (err) {
      console.error("Error calling heavy‑rain endpoint:", err);
    }
  };

  // -----------------------------------------------------------------
  // UI
  // -----------------------------------------------------------------
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