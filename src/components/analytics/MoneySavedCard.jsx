import React from 'react';
import { IndianRupee } from 'lucide-react';
import SummaryCard from './SummaryCard.jsx';

/**
 * Component 2 of 22: MoneySavedCard
 * Highlights financial savings with a soft emerald/green glowing box-shadow,
 * representing money saved by utilizing GridVault ESS over coal peaking units.
 */
export default function MoneySavedCard({
  title = 'Total Money Saved',
  value = '₹3,42,800',
  trend = '+14% vs last month',
  subtitle = 'Grid Arbitrage & Peaking Tariff Savings',
}) {
  return (
    <SummaryCard
      title={title}
      value={value}
      trend={trend}
      subtitle={subtitle}
      icon={IndianRupee}
      variant="emerald"
    />
  );
}
