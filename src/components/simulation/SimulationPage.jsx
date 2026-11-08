import React from "react";
import DashboardLayout from "../../layout/DashboardLayout";

// SimulationPage – master wrapper for the simulation screen.
// Wrapped in DashboardLayout and given the global dark‑theme background.

const SimulationPage = () => {
  return (
    <DashboardLayout>
      {/* Dark‑theme background for the page */}
      <div className="bg-slate-900 min-h-screen p-4 text-slate-100">
        Simulation Page (coming soon)
      </div>
    </DashboardLayout>
  );
};

export default SimulationPage;
