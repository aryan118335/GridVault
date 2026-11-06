import React from 'react';
import MoneySavedCard from './MoneySavedCard.jsx';
import PeakDemandCard from './PeakDemandCard.jsx';
import CarbonOffsetCard from './CarbonOffsetCard.jsx';
import IRRandLCOSCard from './IRRandLCOSCard.jsx';

/**
 * ExecutiveSummary
 * Master UI block for the executive financial KPI summary cards.
 * Displays:
 *  1. Total Net Revenue / Total Money Saved (Emerald glow)
 *  2. Peak Demand Cost Avoided (Amber glow)
 *  3. Carbon Offset (Cyan/Blue glow)
 *  4. Cumulative IRR & LCOS Index (Violet glow)
 *
 * Rendered using a responsive CSS Grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4).
 * Supports direct props (title, value, trend) and structured card config objects.
 */
export default function ExecutiveSummary({
  // Direct props support as requested in prompt:
  title = 'Total Money Saved',
  value = '₹3,42,800',
  trend = '+14% vs last month',

  // Custom overrides:
  financial,
  peakDemand,
  carbon,
  irrLcos,
}) {
  const financialData = {
    title: financial?.title || title,
    value: financial?.value || value,
    trend: financial?.trend || trend,
    subtitle: financial?.subtitle || 'Arbitrage & Peaking Tariff Economics',
  };

  const peakDemandData = {
    title: peakDemand?.title || 'Peak Demand Cost Avoided',
    value: peakDemand?.value || '₹1,84,500',
    trend: peakDemand?.trend || '+9.2% peak shaved',
    subtitle: peakDemand?.subtitle || '480 kW Surcharge Reduction via Battery',
  };

  const carbonData = {
    title: carbon?.title || 'Carbon Offset',
    value: carbon?.value || '128.4 MT CO₂e',
    trend: carbon?.trend || '+18% vs last month',
    subtitle: carbon?.subtitle || 'Thermal Displaced (≈ 5,840 Trees Planted)',
  };

  const irrData = {
    title: irrLcos?.title || 'Cumulative IRR & LCOS',
    value: irrLcos?.value || '18.4% IRR',
    trend: irrLcos?.trend || 'LCOS: ₹4.12 / kWh',
    subtitle: irrLcos?.subtitle || 'Projected Payback: 3.8 Years',
  };

  return (
    <section aria-label="Executive Financial KPI Summary Cards" className="w-full">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <MoneySavedCard
          title={financialData.title}
          value={financialData.value}
          trend={financialData.trend}
          subtitle={financialData.subtitle}
        />

        <PeakDemandCard
          title={peakDemandData.title}
          value={peakDemandData.value}
          trend={peakDemandData.trend}
          subtitle={peakDemandData.subtitle}
        />

        <CarbonOffsetCard
          title={carbonData.title}
          value={carbonData.value}
          trend={carbonData.trend}
          subtitle={carbonData.subtitle}
        />

        <IRRandLCOSCard
          title={irrData.title}
          value={irrData.value}
          trend={irrData.trend}
          subtitle={irrData.subtitle}
        />
      </div>
    </section>
  );
}
