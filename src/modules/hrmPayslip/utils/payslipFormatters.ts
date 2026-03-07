import { MONTHS } from "./payslipConstants";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPeriodLabel(year: number, month: number): string {
  const m = MONTHS.find((mo) => mo.value === month);
  return `${m?.fullLabel ?? month} ${year}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "--";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function maskAccountNumber(account: string): string {
  if (!account || account.length <= 4) return account;
  return "XXXX " + account.slice(-4);
}
