import React from 'react';
import { Percent } from 'lucide-react';
import SummaryCard from './SummaryCard.jsx';
import { formatPercentage } from './formatters.js';

/**
 * IRRandLCOSCard
 * High-impact metric card displaying Cumulative IRR & LCOS (Levelized Cost of Storage).
 * Accepts either pre-formatted strings (legacy) or numeric irr/lcos values.
 */
export default function IRRandLCOSCard({
  title = 'Cumulative IRR & LCOS',
  // Accept numeric irr value OR a pre-formatted string for 'value'
  value,
  irr = 18.4,
  lcos = 4.12,
  trend,
  subtitle = 'Benchmark Payback Period: 3.8 Years',
}) {
  const displayValue = value !== undefined ? value : `${formatPercentage(irr)} IRR`;
  const displayTrend = trend !== undefined ? trend : `LCOS: ₹${lcos.toFixed(2)} / kWh`;
  return (
    <SummaryCard
      title={title}
      value={displayValue}
      trend={displayTrend}
      subtitle={subtitle}
      icon={Percent}
      variant="violet"
    />
  );
}
