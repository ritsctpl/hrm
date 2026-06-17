/**
 * HRM Grade Module — Constants
 */

export const TRACK_OPTIONS = [
  { label: 'Engineering', value: 'ENGINEERING' },
  { label: 'Management', value: 'MANAGEMENT' },
  { label: 'Operations', value: 'OPERATIONS' },
  { label: 'Sales', value: 'SALES' },
  { label: 'Support', value: 'SUPPORT' },
  { label: 'General', value: 'GENERAL' },
];

export const APPRAISAL_CYCLE_OPTIONS = [
  { label: 'Annual', value: 'ANNUAL' },
  { label: 'Half-Yearly', value: 'HALF_YEARLY' },
  { label: 'Quarterly', value: 'QUARTERLY' },
];

export const CURRENCY_OPTIONS = [
  { label: 'INR (₹)', value: 'INR' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
];

export const TRACK_COLOR_MAP: Record<string, string> = {
  ENGINEERING: 'blue',
  MANAGEMENT: 'purple',
  OPERATIONS: 'cyan',
  SALES: 'gold',
  SUPPORT: 'green',
  GENERAL: 'default',
};

export const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};
