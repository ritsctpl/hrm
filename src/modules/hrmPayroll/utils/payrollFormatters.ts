import { PAYROLL_MONTHS } from './payrollConstants';

export function formatINR(amount: number): string {
  if (amount === 0) return '0';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRWithPrefix(amount: number): string {
  return `₹${formatINR(amount)}`;
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
