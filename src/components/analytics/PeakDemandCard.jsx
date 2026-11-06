import React from 'react';
import { TrendingDown } from 'lucide-react';
import SummaryCard from './SummaryCard.jsx';

/**
 * PeakDemandCard
 * High-impact metric card displaying Peak Demand Cost Avoided (kW shaved).
 */
export default function PeakDemandCard({
  title = 'Peak Demand Cost Avoided',
  value = '₹1,84,500',
  trend = '+9.2% demand shaved',
  subtitle = '480 kW Peak Surcharge Shaved via Battery',
}) {
  return (
    <SummaryCard
      title={title}
      value={value}
      trend={trend}
      subtitle={subtitle}
      icon={TrendingDown}
      variant="amber"
    />
  );
}
