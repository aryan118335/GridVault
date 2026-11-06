import React from 'react';
import { Leaf } from 'lucide-react';
import SummaryCard from './SummaryCard.jsx';

/**
 * Component 3 of 22: CarbonOffsetCard
 * Highlights environmental impact with a soft cyan/blue glowing box-shadow,
 * representing CO2 mitigation and clean green renewable power integration.
 */
export default function CarbonOffsetCard({
  title = 'Carbon Offset',
  value = '128.4 MT CO₂e',
  trend = '+18% vs last month',
  subtitle = 'Thermal Displaced (≈ 5,840 Trees Planted)',
}) {
  return (
    <SummaryCard
      title={title}
      value={value}
      trend={trend}
      subtitle={subtitle}
      icon={Leaf}
      variant="cyan"
    />
  );
}
