/**
 * Regional Locale Standards Number & Currency Formatters
 * Nov 14 Milestone: Standardize number formatting across all financial metrics
 * using Intl.NumberFormat for currency symbols, decimals, and percentages.
 */

// Regional Indian numbering system (Lakhs & Crores) as statutory standard
const DEFAULT_LOCALE = 'en-IN';
const DEFAULT_CURRENCY = 'INR';

/**
 * Standard Currency Formatter using Intl.NumberFormat
 * e.g., 342800 -> "₹3,42,800"
 */
export function formatCurrency(amount, options = {}) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const {
    locale = DEFAULT_LOCALE,
    currency = DEFAULT_CURRENCY,
    compact = false,
    maximumFractionDigits = 0,
    minimumFractionDigits = 0,
  } = options;

  if (compact) {
    if (Math.abs(num) >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(num) >= 100000) {
      return `₹${(num / 100000).toFixed(2)} L`;
    }
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(num);
}

/**
 * Standard Percentage Formatter using Intl.NumberFormat
 * e.g., 0.142 -> "+14.2%" or 14.2 -> "+14.2%"
 */
export function formatPercentage(value, options = {}) {
  const {
    locale = DEFAULT_LOCALE,
    decimals = 1,
    includeSign = true,
    isRatio = false, // true if value is 0.14 instead of 14.0
  } = options;

  const raw = typeof value === 'number' ? value : parseFloat(value) || 0;
  const ratio = isRatio ? raw : raw / 100;

  const formatted = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: includeSign ? 'exceptZero' : 'auto',
  }).format(ratio);

  return formatted;
}

/**
 * Standard Number Formatter using Intl.NumberFormat
 * e.g., 184500 -> "1,84,500"
 */
export function formatNumber(value, options = {}) {
  const {
    locale = DEFAULT_LOCALE,
    decimals = 0,
  } = options;

  const num = typeof value === 'number' ? value : parseFloat(value) || 0;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Energy Quantity Formatter (MW, MWh, kW)
 * e.g., 14.8 -> "14.8 MWh"
 */
export function formatEnergy(value, unit = 'MWh', decimals = 1) {
  const num = typeof value === 'number' ? value : parseFloat(value) || 0;
  return `${new Intl.NumberFormat(DEFAULT_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)} ${unit}`;
}

/**
 * Metric Carbon Tonnes Formatter
 * e.g., 128.4 -> "128.4 MT CO₂e"
 */
export function formatCarbonOffset(value, decimals = 1) {
  const num = typeof value === 'number' ? value : parseFloat(value) || 0;
  return `${new Intl.NumberFormat(DEFAULT_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)} MT CO₂e`;
}
