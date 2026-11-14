import React from 'react';
import { TrendingDown } from 'lucide-react';
import SummaryCard from './SummaryCard.jsx';
import { formatCurrency, formatPercentage } from './formatters.js';

/**
 * PeakDemandCard
 * Peak Demand Cost Avoided — formatted using regional locale standards.
 */
export default function PeakDemandCard({
  title = 'Peak Demand Cost Avoided',
  value = 184500,
  trend = 9.2,
  subtitle = '480 kW Peak Surcharge Shaved via Battery',
}) {
  const formattedValue = typeof value === 'number' ? formatCurrency(value) : value;
  const formattedTrend =
    typeof trend === 'number' ? `${formatPercentage(trend)} demand shaved` : trend;

  return (
    <SummaryCard
      title={title}
      value={formattedValue}
      trend={formattedTrend}
      subtitle={subtitle}
      icon={TrendingDown}
      variant="amber"
    />
  );
}
