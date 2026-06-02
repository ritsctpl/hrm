import type { ExpenseReport } from "../types/domain.types";
import dayjs from "dayjs";

export function formatExpenseDateRange(report: ExpenseReport): string {
  if (!report.items || report.items.length === 0) return "—";
  
  const dates = report.items
    .map((item) => item.expenseDate)
    .filter((date): date is string => !!date)
    .sort();
  
  if (dates.length === 0) return "—";
  
  const fromDate = dates[0];
  const toDate = dates[dates.length - 1];
  
  if (!fromDate) return "—";
  if (!toDate || fromDate === toDate) {
    return dayjs(fromDate).format("DD MMM YYYY");
  }
  return `${dayjs(fromDate).format("DD MMM")} – ${dayjs(toDate).format("DD MMM YYYY")}`;
}

export function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function computeExpenseSlaInfo(report: ExpenseReport) {
  if (!report.slaDeadline) {
    return { daysRemaining: null, isOverdue: false, label: "", color: "success" as const };
  }
  const days = dayjs(report.slaDeadline).diff(dayjs(), "day");
  if (days < 0) {
    const overdue = Math.abs(days);
    return {
      daysRemaining: days,
      isOverdue: true,
      label: overdue === 1 ? "Overdue 1 day" : `Overdue ${overdue} days`,
      color: "error" as const,
    };
  }
  if (days === 0) {
    return { daysRemaining: 0, isOverdue: false, label: "Due today", color: "warning" as const };
  }
  if (days === 1) {
    return { daysRemaining: 1, isOverdue: false, label: "Due tomorrow", color: "warning" as const };
  }
  if (days <= 3) {
    return {
      daysRemaining: days,
      isOverdue: false,
      label: `Due in ${days} days`,
      color: "warning" as const,
    };
  }
  return {
    daysRemaining: days,
    isOverdue: false,
    label: `Due in ${days} days`,
    color: "success" as const,
  };
}
