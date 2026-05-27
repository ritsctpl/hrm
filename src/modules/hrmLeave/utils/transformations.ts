import { LeaveBalanceResponse } from "../types/api.types";
import { LeaveBalance } from "../types/domain.types";

/** Coerce possibly-string/null numeric fields to a finite number (else 0). */
const toNum = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function mapBalanceResponseToDomain(res: LeaveBalanceResponse): LeaveBalance {
  const openingCarryForward = toNum(res.openingCarryForward);
  const ytdCredits = toNum(res.ytdCredits);
  const ytdDebits = toNum(res.ytdDebits);
  const ytdEncashed = toNum(res.ytdEncashed);
  const ytdLapsed = toNum(res.ytdLapsed);
  const pendingApproval = toNum(res.pendingApproval);
  const currentBalance = toNum(res.currentBalance);
  // Derived figure used as a fallback. The /leave-balance/retrieve endpoint
  // sometimes omits or nulls `availableBalance` even when the component
  // figures are populated, which made the dashboard render 0 for a real
  // balance. Prefer the explicit value, then currentBalance, then derive it.
  const derived =
    openingCarryForward + ytdCredits - ytdDebits - ytdEncashed - ytdLapsed;
  const hasExplicitAvailable =
    res.availableBalance != null && Number.isFinite(Number(res.availableBalance));
  const availableBalance = hasExplicitAvailable
    ? toNum(res.availableBalance)
    : currentBalance || derived;
  return {
    employeeId: res.employeeId,
    employeeNumber: res.employeeNumber,
    employeeName: res.employeeName,
    department: res.department,
    leaveTypeCode: res.leaveTypeCode,
    leaveTypeName: res.leaveTypeName,
    leaveTypeAlias: res.leaveTypeAlias,
    year: res.year,
    openingCarryForward,
    ytdCredits,
    ytdDebits,
    ytdEncashed,
    ytdLapsed,
    pendingApproval,
    currentBalance: currentBalance || derived,
    availableBalance,
    carryForwardAllowed: !!res.carryForwardAllowed,
    carryForwardCap: toNum(res.carryForwardCap),
    encashmentAllowed: !!res.encashmentAllowed,
    halfDayAllowed: !!res.halfDayAllowed,
    lastCalculatedAt: res.lastCalculatedAt,
  };
}

export function formatDays(days: number): string {
  if (days === Math.floor(days)) return `${days}.0 days`;
  return `${days} days`;
}

export function formatDayType(dayType: string): string {
  const map: Record<string, string> = {
    FULL: "Full Day",
    FIRST_HALF: "AM (First Half)",
    SECOND_HALF: "PM (Second Half)",
  };
  return map[dayType] ?? dayType;
}

export function getSlaRemainingMs(deadline: string): number {
  return new Date(deadline).getTime() - Date.now();
}

export function formatSlaCountdown(deadline: string): string {
  const remainingMs = getSlaRemainingMs(deadline);
  if (remainingMs <= 0) return "SLA Breached";
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `SLA: ${hours}h ${minutes}m`;
  return `SLA: ${minutes}m`;
}

export function getLeaveTypeColor(code: string): string {
  const colors: Record<string, string> = {
    CL: "#1890ff",
    SL: "#52c41a",
    PL: "#722ed1",
    CO: "#fa8c16",
    WFH: "#13c2c2",
  };
  return colors[code] ?? "#8c8c8c";
}

export function buildYearOptions(currentYear: number, range = 3): { value: number; label: string }[] {
  const years = [];
  for (let y = currentYear - range; y <= currentYear + 1; y++) {
    years.push({ value: y, label: `${y}` });
  }
  return years;
}
