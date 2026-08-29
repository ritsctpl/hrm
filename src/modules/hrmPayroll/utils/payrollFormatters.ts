import { PAYROLL_MONTHS } from './payrollConstants';
import { MASKED_PLACEHOLDER, isMasked } from '@/utils/salaryAmount';

export function formatINR(amount: number | null | undefined): string {
  // A withheld figure arrives as null. Formatting it would print 0 -- which reads as "this person
  // earns nothing" rather than "you are not allowed to see this", and is the wrong answer to a
  // question the viewer simply has not stepped up to ask.
  if (isMasked(amount)) return MASKED_PLACEHOLDER;
  if (amount === 0) return '0';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRWithPrefix(amount: number | null | undefined): string {
  return isMasked(amount) ? MASKED_PLACEHOLDER : `₹${formatINR(amount)}`;
}

export function formatPayrollPeriod(year: number, month: number): string {
  const monthLabel = PAYROLL_MONTHS.find((m) => m.value === month)?.label ?? String(month);
  return `${monthLabel} ${year}`;
}

export function formatRunId(runId: string): string {
  return runId;
}

export function computeVariancePct(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function formatVariancePct(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

export function getCurrentFinancialYear(): number {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month >= 4 ? now.getFullYear() : now.getFullYear() - 1;
}
