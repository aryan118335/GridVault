import React from "react";
import DashboardLayout from "../../layout/DashboardLayout";

// SimulationPage – master wrapper for the simulation screen.
// Currently it returns a placeholder wrapped in DashboardLayout.

const SimulationPage = () => {
  return (
    <DashboardLayout>
      <div className="p-4">
        Simulation Page (coming soon)
      </div>
    </DashboardLayout>
  );
};

export default SimulationPage;
