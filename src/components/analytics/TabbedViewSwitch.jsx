import React from 'react';
import { BarChart3, FileText, LayoutDashboard } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
  { id: 'financial', label: 'Financial & ROI Analysis', icon: BarChart3 },
  { id: 'compliance', label: 'Regulatory Compliance', icon: FileText },
];

/**
 * TabbedViewSwitch
 * Interactive navigation tab switch for switching between analytics workspace views.
 */
export default function TabbedViewSwitch({ activeTab = 'overview', onTabChange }) {
  return (
    <nav
      aria-label="Analytics view switcher"
      className="inline-flex rounded-xl border border-slate-800 bg-slate-900/90 p-1"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange?.(id)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              isActive
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-[0_0_16px_rgba(20,184,166,0.35)]'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <Icon className="h-3.5 w-3.5 stroke-[2.2]" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
