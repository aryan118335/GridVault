import React, { useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout.jsx';
import KPIHeaderRibbon from './KPIHeaderRibbon.jsx';
import DateRangeSelector from './DateRangeSelector.jsx';
import TabbedViewSwitch from './TabbedViewSwitch.jsx';
import ExecutiveSummary from './ExecutiveSummary.jsx';
import FinancialChart from './FinancialChart.jsx';

/**
 * AnalyticsPage
 * Base page scaffolding for the analytics and financial reports dashboard.
 * Encapsulates KPI header ribbon, date range selector bar, and tabbed view switch,
 * wrapped securely inside Ayush's DashboardLayout.
 */
export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState('30D');
  const [activeTab, setActiveTab] = useState('overview');
  const [lastSynced, setLastSynced] = useState('Just now');

  const handleRefresh = () => {
    setLastSynced(
      new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* KPI Header Ribbon */}
        <KPIHeaderRibbon lastSynced={lastSynced} onRefresh={handleRefresh} />

        {/* Workspace Controls Bar: Tabbed View Switch + Date Range Selector */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabbedViewSwitch activeTab={activeTab} onTabChange={setActiveTab} />
          <DateRangeSelector
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
          />
        </div>

        {/* Tab 1: Executive Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Executive Financial KPI Summary Cards */}
            <ExecutiveSummary />

            {/* Financial Cost & ROI Bar Chart */}
            <FinancialChart />

            {/* Compliance Table Slot Placeholder (Nov 09 Milestone) */}
            <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/80 bg-slate-800/50 p-8 text-center">
              <p className="text-sm font-semibold text-slate-300">
                Government Compliance Reports Slot
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Ready for Nov 09 Regulatory Report Table &amp; Direct PDF Download Integration
              </p>
            </section>
          </div>
        )}

        {/* Tab 2: Dedicated Financial ROI View */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <FinancialChart />
          </div>
        )}

        {/* Tab 3: Dedicated Compliance & Audit View */}
        {activeTab === 'compliance' && (
          <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/80 bg-slate-800/60 p-12 text-center">
            <h3 className="text-base font-semibold text-white">Regulatory Audit Log &amp; Filings</h3>
            <p className="mt-1 max-w-md text-xs text-slate-400">
              FERC/NERC and CEA compliance documents with one-click signed PDF exports.
            </p>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

