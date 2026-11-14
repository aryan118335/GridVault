import React from 'react';
import { IndianRupee } from 'lucide-react';
import SummaryCard from './SummaryCard.jsx';
import { formatCurrency, formatPercentage } from './formatters.js';

/**
 * Component 2: MoneySavedCard
 * Highlights financial savings formatted per regional locale standards (INR / en-IN).
 */
export default function MoneySavedCard({
  title = 'Total Money Saved',
  value = 342800,
  trend = 14,
  subtitle = 'Grid Arbitrage & Peaking Tariff Savings',
}) {
  const formattedValue = typeof value === 'number' ? formatCurrency(value) : value;
  const formattedTrend =
    typeof trend === 'number' ? `${formatPercentage(trend)} vs last month` : trend;

  return (
    <SummaryCard
      title={title}
      value={formattedValue}
      trend={formattedTrend}
      subtitle={subtitle}
      icon={IndianRupee}
      variant="emerald"
    />
  );
}
