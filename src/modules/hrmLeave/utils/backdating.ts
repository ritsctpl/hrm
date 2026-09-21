/**
 * The backdated-leave window (HRM issue #3).
 *
 * A leave request may start no earlier than the last {@link PREVIOUS_MONTH_GRACE_DAYS} days
 * of the previous calendar month; anything inside the current month (or in the future) is
 * fine. The rule applies to EVERYONE — HR submitting on an employee's behalf included
 * (business decision, 2026-09-21); there is no HR override.
 *
 * Mirrors the backend's unconditional floor in hrm-service
 * `leave/service/LeaveBackdatingRules.isWithinUnconditionalFloor`:
 *   graceStart = today.withDayOfMonth(1).minusDays(10); allowed iff !startDate.isBefore(graceStart)
 * e.g. today anywhere in September 2026 → earliest allowed start is Sat 22 Aug 2026
 * (22–31 Aug = the last 10 days of August). Keep the two in step.
 */
export const PREVIOUS_MONTH_GRACE_DAYS = 10;

function parseLocal(dateStr: string): Date {
  const [y, m, d] = String(dateStr).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
}

/** Earliest start date (YYYY-MM-DD) a leave request may have when submitted on `today`. */
export function earliestAllowedLeaveStart(today: string): string {
  const t = parseLocal(today);
  // Day 1 of the current month, minus the grace days (Date handles the month/year roll).
  return ymd(new Date(t.getFullYear(), t.getMonth(), 1 - PREVIOUS_MONTH_GRACE_DAYS));
}

/** True when `startDate` is further back than the window allows — submission is blocked. */
export function isBackdatedBeyondWindow(startDate: string | null | undefined, today: string): boolean {
  if (!startDate) return false;
  return String(startDate).slice(0, 10) < earliestAllowedLeaveStart(today);
}
