import React from 'react';
import { Leaf } from 'lucide-react';
import SummaryCard from './SummaryCard.jsx';
import { formatCarbonOffset, formatPercentage } from './formatters.js';

/**
 * Component 3: CarbonOffsetCard
 * Highlights environmental impact with standardized units and percentages.
 */
export default function CarbonOffsetCard({
  title = 'Carbon Offset',
  value = 128.4,
  trend = 18,
  subtitle = 'Thermal Displaced (≈ 5,840 Trees Planted)',
}) {
  const formattedValue =
    typeof value === 'number' ? formatCarbonOffset(value) : value;
  const formattedTrend =
    typeof trend === 'number' ? `${formatPercentage(trend)} vs last month` : trend;

  return (
    <SummaryCard
      title={title}
      value={formattedValue}
      trend={formattedTrend}
      subtitle={subtitle}
      icon={Leaf}
      variant="cyan"
    />
  );
}
