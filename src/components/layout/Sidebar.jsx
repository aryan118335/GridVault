import { NavLink } from 'react-router-dom';
import {
  Activity,
  Bell,
  ChevronDown,
  Cpu,
  LayoutDashboard,
  LineChart,
  Settings,
  X,
  Zap,
} from 'lucide-react';

const PRIMARY_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { to: '/simulation', label: 'Simulation', icon: Activity, badge: null },
  { to: '/analytics', label: 'Analytics', icon: LineChart, badge: null },
];

const SECONDARY_NAV = [
  { label: 'Alerts', icon: Bell, badge: 8 },
  { label: 'Devices', icon: Cpu, badge: null },
  { label: 'Settings', icon: Settings, badge: null },
];

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950/95 transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-teal-400 text-slate-950 shadow-[0_0_18px_rgba(20,184,166,0.45)]">
              <Zap className="h-5 w-5 stroke-[2.4]" />
            </div>
            <span className="text-lg font-bold tracking-wider text-white">GRIDCORE</span>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-5">
          <div className="space-y-1.5">
            {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'border-l-4 border-teal-400 bg-gradient-to-r from-teal-500/25 via-emerald-500/10 to-transparent text-white shadow-[inset_0_0_24px_rgba(20,184,166,0.14)]'
                      : 'border-l-4 border-transparent text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
              </NavLink>
            ))}

            <div className="my-4 border-t border-slate-800/80 pt-4">
              {SECONDARY_NAV.map(({ label, icon: Icon, badge }) => (
                <button
                  key={label}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border-l-4 border-transparent px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  {badge !== null && (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Settings & Operator Profile */}
          <div className="space-y-2 border-t border-slate-800/80 pt-4">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>

            <div className="flex items-center justify-between rounded-xl bg-slate-900/90 px-3 py-2.5 ring-1 ring-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 text-xs font-bold text-slate-950">
                  UH
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-white">Profile</p>
                  <p className="text-[11px] text-slate-400">User haminer</p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
