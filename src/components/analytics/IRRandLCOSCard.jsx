import React from 'react';
import { Percent } from 'lucide-react';
import SummaryCard from './SummaryCard.jsx';

/**
 * IRRandLCOSCard
 * High-impact metric card displaying Cumulative IRR & LCOS (Levelized Cost of Storage).
 */
export default function IRRandLCOSCard({
  title = 'Cumulative IRR & LCOS',
  value = '18.4% IRR',
  trend = 'LCOS: ₹4.12 / kWh',
  subtitle = 'Benchmark Payback Period: 3.8 Years',
}) {
  return (
    <SummaryCard
      title={title}
      value={value}
      trend={trend}
      subtitle={subtitle}
      icon={Percent}
      variant="violet"
    />
  );
}
