import React, { useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout.jsx';
import KPIHeaderRibbon from './KPIHeaderRibbon.jsx';
import DateRangeSelector from './DateRangeSelector.jsx';
import TabbedViewSwitch from './TabbedViewSwitch.jsx';
import ExecutiveSummary from './ExecutiveSummary.jsx';
import FinancialChart from './FinancialChart.jsx';
import PaybackCurveChart from './PaybackCurveChart.jsx';
import ComplianceTable from './ComplianceTable.jsx';
import ComplianceAuditLog from './ComplianceAuditLog.jsx';

/**
 * AnalyticsPage
 * Base page scaffolding for the analytics and financial reports dashboard.
 * Encapsulates KPI header ribbon, date range selector bar, and tabbed view switch,
 * wrapped securely inside Ayush's DashboardLayout.
 */
export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState('30D');
  const [aggregation, setAggregation] = useState('1d');
  const [dateBounds, setDateBounds] = useState({ start: '2026-10-19', end: '2026-11-18' });
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

  const handleRangeChange = (rangeId, bounds) => {
    setSelectedRange(rangeId);
    if (bounds) setDateBounds(bounds);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* KPI Header Ribbon */}
        <KPIHeaderRibbon lastSynced={lastSynced} onRefresh={handleRefresh} />

        {/* Workspace Controls Bar: Tabbed View Switch + Custom Date Range & Aggregation Filter */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabbedViewSwitch activeTab={activeTab} onTabChange={setActiveTab} />
          <DateRangeSelector
            selectedRange={selectedRange}
            aggregation={aggregation}
            onRangeChange={handleRangeChange}
            onAggregationChange={setAggregation}
          />
        </div>

        {/* Tab 1: Executive Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Executive Financial KPI Summary Cards */}
            <ExecutiveSummary />

            {/* Financial Cost & ROI Bar Chart */}
            <FinancialChart />

            {/* Cumulative ROI vs Capex Payback Curve Graph */}
            <PaybackCurveChart />

            {/* Government Compliance Reports Table */}
            <ComplianceTable />
          </div>
        )}

        {/* Tab 2: Dedicated Financial ROI View */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <FinancialChart />
            <PaybackCurveChart />
          </div>
        )}

        {/* Tab 3: Dedicated Compliance & Audit View */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <ComplianceTable />
            <ComplianceAuditLog />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

