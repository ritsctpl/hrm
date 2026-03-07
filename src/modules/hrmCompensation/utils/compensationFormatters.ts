/**
 * HRM Compensation Module — Formatters
 */

/** Format a number as INR currency string */
export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format a number as plain INR with commas (no symbol) */
export function formatINRPlain(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format percentage */
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

/** Convert number to Indian words (simplified) */
export function numberToWords(value: number): string {
  if (value >= 10_000_000) return `${(value / 10_000_000).toFixed(2)} Cr`;
  if (value >= 100_000) return `${(value / 100_000).toFixed(2)} L`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)} K`;
  return String(value);
}
