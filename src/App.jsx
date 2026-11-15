import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

function TeammateRouteNotice({ title, owner }) {
  return (
    <DashboardLayout>
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/60 p-8 text-center">
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">
          This route is reserved for <span className="font-semibold text-teal-400">{owner}</span>.
          Only Ayush&apos;s Live Grid Dashboard is implemented locally.
        </p>
      </div>
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route
        path="/simulation"
        element={<TeammateRouteNotice title="Simulation & Control Panel" owner="Aryan" />}
      />
      <Route
        path="/analytics"
        element={<TeammateRouteNotice title="Analytics, ROI & Compliance Reports" owner="Varad" />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
