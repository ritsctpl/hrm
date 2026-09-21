// src/modules/hrmTimesheet/utils/timesheetHelpers.ts
import type { DayColorCode } from '../types/domain.types';
import { GREEN_THRESHOLD, YELLOW_THRESHOLD } from './timesheetConstants';

export function computeColorCode(totalHours: number): DayColorCode {
  if (totalHours >= GREEN_THRESHOLD) return 'GREEN';
  if (totalHours > YELLOW_THRESHOLD) return 'YELLOW';
  return 'RED';
}

export function formatHours(hours: number): string {
  return `${hours.toFixed(1)} h`;
}

/** Returns the Monday (local midnight) of the week containing the given date. */
export function getWeekStart(date: Date): Date {
  return parseLocalDate(mondayOf(ymd(date)));
}

/** Returns ISO date string (YYYY-MM-DD) */
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Returns true if the given ISO date is outside the lock window.
 *  Lock window: current month + previous 15 days.
 */
export function isLocked(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lockBoundary = new Date(currentMonthStart);
  lockBoundary.setDate(lockBoundary.getDate() - 15);
  return date < lockBoundary;
}

/** Returns short day name for a date (Mon, Tue…) */
export function getDayLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short' });
}

/** Adds `days` to an ISO date string, returns ISO date string */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

// ─── Calendar / matrix helpers (PRD redesign) ──────────────────────────────

/** Local YYYY-MM-DD (avoids the UTC shift that toISOString can introduce). */
function ymd(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Parses YYYY-MM-DD (or the date part of an ISO timestamp) as LOCAL midnight.
 * `new Date('YYYY-MM-DD')` is UTC midnight, which is the previous day in any
 * negative-offset zone.
 */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Local-calendar day arithmetic on YYYY-MM-DD strings (DST-safe). */
function shiftDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return ymd(d);
}

// ─── Week convention ────────────────────────────────────────────────────────
// Timesheet weeks run MONDAY → SUNDAY (HRM issue #2 — the original PRD had Sun→Sat,
// which made the team log hours on Sunday by mistake, and put the "Week-N not
// submitted" banner on different weeks from the ones people submit; HRM issue #6).
// This matches the backend (CompliancePeriod uses Monday weeks; /retrieveWeekly and
// /bulkSubmitWeekly take the Monday as weekStartDate). Every week computation in the
// module goes through mondayOf(); do not derive a week start anywhere else.

/** Column headers for a Mon→Sun week. */
export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** Monday of the (Mon→Sun) week containing `dateStr` (YYYY-MM-DD). */
export function mondayOf(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  // getDay(): 0 = Sun … 6 = Sat. Days since Monday: Mon 0 … Sun 6.
  return shiftDays(ymd(d), -((d.getDay() + 6) % 7));
}

/** Saturday or Sunday — the weekly-off days, whatever day the week starts on. */
export function isWeekendDate(dateStr: string): boolean {
  const day = parseLocalDate(dateStr).getDay();
  return day === 0 || day === 6;
}

/** The 7 dates (Mon→Sun) of the week containing `dateStr`. */
export function weekDates(dateStr: string): string[] {
  const start = mondayOf(dateStr);
  return Array.from({ length: 7 }, (_, i) => shiftDays(start, i));
}

/**
 * Monday of the week `delta` whole weeks away from the week containing `dateStr`.
 * `delta` of 0 normalises to the current week's Monday, so callers can use this as the
 * single way to express "the week I am on" and "the week next to it".
 */
export function shiftWeekStart(dateStr: string, delta: number): string {
  return shiftDays(mondayOf(dateStr), delta * 7);
}

/**
 * True when any day of the week containing `dateStr` falls inside `monthStart`'s month.
 *
 * Week navigation in the manager review is bounded by this: the grid is fed by a
 * month-scoped load, so stepping onto a week with no overlap at all would show seven
 * empty columns and read as "this employee logged nothing".
 */
export function weekIntersectsMonth(dateStr: string, monthStart: string): boolean {
  const [year, month] = monthStart.split('-').map(Number);
  return weekDates(dateStr).some((d) => {
    const [dy, dm] = d.split('-').map(Number);
    return dy === year && dm === month;
  });
}

export function isToday(dateStr: string): boolean {
  return dateStr === ymd(new Date());
}

export function isFutureDate(dateStr: string): boolean {
  return dateStr > ymd(new Date());
}

/** PRD core rule: entry is allowed only for dates in the current calendar month. */
export function isInCurrentMonth(dateStr: string): boolean {
  const now = new Date();
  const d = new Date(dateStr);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/**
 * Submission window (rolling "month + 7"): a date stays editable through the
 * 7th day of the month AFTER the date's own month. e.g. June dates lock after
 * 07-Jul; July dates lock after 07-Aug. Future dates are allowed (the lock
 * only ever closes the trailing edge once a month has fully elapsed + 7 days).
 */
export function isWithinTimesheetWindow(dateStr: string): boolean {
  const d = new Date(dateStr);
  // 7th of the month following the date's month (end of day so the 7th itself
  // is still inclusive).
  const lockBoundary = new Date(d.getFullYear(), d.getMonth() + 1, 7, 23, 59, 59, 999);
  return new Date() <= lockBoundary;
}

/** Formats decimal hours as "HH:MM" (e.g. 8.5 -> "08:30"). */
export function decimalToHHMM(hours: number): string {
  const safe = Number.isFinite(hours) ? hours : 0;
  const h = Math.floor(safe);
  const m = Math.round((safe - h) * 60);
  return `${`${h}`.padStart(2, '0')}:${`${m}`.padStart(2, '0')}`;
}

/**
 * Builds the month calendar grid as full Mon→Sun weeks covering `monthStart`
 * (YYYY-MM-01). Leading/trailing cells from adjacent months are included so
 * every row has 7 days; `inMonth` flags which belong to the displayed month.
 */
export function buildMonthMatrix(monthStart: string): { date: string; inMonth: boolean }[][] {
  const first = parseLocalDate(monthStart);
  const year = first.getFullYear();
  const month = first.getMonth();
  const weeks: { date: string; inMonth: boolean }[][] = [];
  const cursor = parseLocalDate(mondayOf(ymd(first)));
  // Up to 6 rows; stop once we've passed the month and completed the week.
  for (let w = 0; w < 6; w++) {
    const row: { date: string; inMonth: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const ds = ymd(cursor);
      row.push({ date: ds, inMonth: cursor.getMonth() === month && cursor.getFullYear() === year });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(row);
    if (cursor.getMonth() !== month && cursor > first) break;
  }
  return weeks;
}

/**
 * The date range (inclusive, YYYY-MM-DD) the month grid for `monthStart` shows: from the
 * Monday of the week holding the 1st to the Sunday of the week holding the last day —
 * i.e. the first and last cells of buildMonthMatrix(monthStart).
 *
 * Load timesheets for THIS range, not just the calendar month: a Mon→Sun week that crosses
 * a month boundary (e.g. Mon 27 Jul – Sun 02 Aug viewed in August) otherwise shows the other
 * month's days as empty but editable, and saving the week would overwrite what is really
 * stored on those days.
 */
export function monthGridRange(monthStart: string): { start: string; end: string } {
  const first = parseLocalDate(monthStart);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  return { start: mondayOf(ymd(first)), end: shiftDays(mondayOf(ymd(last)), 6) };
}

/** True when `dateStr` falls in the calendar month of `monthStart` (YYYY-MM-01). */
export function isInMonth(dateStr: string, monthStart: string): boolean {
  return String(dateStr).slice(0, 7) === String(monthStart).slice(0, 7);
}

/**
 * 1-based index of the (Mon→Sun) week that `dateStr` falls in, counted within a month:
 * week 1 is the week containing the month's 1st.
 *
 * The month defaults to `dateStr`'s own month. Pass `monthStart` (YYYY-MM-01) to number a
 * week that straddles two months against the month being displayed — e.g. the row
 * Mon 27 Jul – Sun 02 Aug 2026 is "Week 1" of August, not "Week 5" of July.
 */
export function weekOfMonthIndex(dateStr: string, monthStart?: string): number {
  const d = parseLocalDate(dateStr);
  const monthFirst = monthStart
    ? ymd(new Date(parseLocalDate(monthStart).getFullYear(), parseLocalDate(monthStart).getMonth(), 1))
    : ymd(new Date(d.getFullYear(), d.getMonth(), 1));
  const firstMonday = parseLocalDate(mondayOf(monthFirst));
  const weekMonday = parseLocalDate(mondayOf(dateStr));
  const diffDays = Math.round((weekMonday.getTime() - firstMonday.getTime()) / 86400000);
  return Math.floor(diffDays / 7) + 1;
}

/** A day that still counts against the employee for the "not submitted" banner. */
export interface PendingSubmissionDay {
  date: string;
  status?: string;
  totalHours?: number;
}

/** One week of the "Week-N … has not been submitted" banner and the days that caused it. */
export interface PendingWeek {
  /** 1-based week-of-month index (Mon→Sun weeks, see weekOfMonthIndex). */
  week: number;
  /** Monday and Sunday of that week. */
  start: string;
  end: string;
  /** The pending days, ascending — always inside [start, end] and inside the month. */
  days: string[];
}

const NOT_SUBMITTED_STATUSES = new Set(['DRAFT', 'REOPENED', 'REJECTED']);

/**
 * The weeks of `monthStart`'s month that still have unsubmitted days, for the
 * "Week-N … has not been submitted" banner (HRM issue #6).
 *
 * A day is pending when it has hours logged, is not in the future (relative to
 * `todayStr`), and its status is DRAFT / REOPENED / REJECTED — SUBMITTED and APPROVED
 * both count as submitted. Days are grouped into Mon→Sun weeks, and only days that are
 * both inside the displayed month and inside that week are ever attributed to it, so a
 * leftover day of the previous week (e.g. Sun 02 Aug) can no longer flag the next one.
 */
export function pendingSubmissionWeeks(
  days: PendingSubmissionDay[],
  monthStart: string,
  todayStr: string,
): PendingWeek[] {
  const monthKey = String(monthStart).slice(0, 7);
  const byWeek = new Map<string, Set<string>>();
  days.forEach((t) => {
    const date = String(t.date ?? '').slice(0, 10);
    if (!date || date.slice(0, 7) !== monthKey) return;
    if (date > todayStr) return;
    if (!NOT_SUBMITTED_STATUSES.has(String(t.status))) return;
    if ((t.totalHours ?? 0) <= 0) return;
    const monday = mondayOf(date);
    if (!byWeek.has(monday)) byWeek.set(monday, new Set());
    byWeek.get(monday)!.add(date);
  });
  return Array.from(byWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monday, set]) => ({
      week: weekOfMonthIndex(monday, monthStart),
      start: monday,
      end: shiftDays(monday, 6),
      days: Array.from(set).sort(),
    }));
}

// ─── Work-from-home days (HRM issue #4) ─────────────────────────────────────
// WFH is stored as an ordinary (auto-approved) leave request whose leave type code starts
// with "WFH" (e.g. "WFH", "WFH_FULL" — the backend's TimesheetServiceImpl.isWfhLeave uses the
// same "WFH" prefix match). It is a WORKING day: it must never lock time entry the way real
// leave (CL/SL/EL…) does. Two backend shapes exist for such a day:
//   - before the backend fix: leaveDay=true,  leaveType="WFH…"
//   - after it:               leaveDay=false, leaveType="WFH…"
// Both unlock entry and both are labelled WFH.

/** Prefix of every leave type code that means "working, just not at the office". */
export const WORKING_LEAVE_TYPE_PREFIX = 'WFH';

/** True for a leave type code that is a working day (WFH*), not time off. */
export function isWorkingLeaveType(leaveType?: string | null): boolean {
  return !!leaveType && leaveType.trim().toUpperCase().startsWith(WORKING_LEAVE_TYPE_PREFIX);
}

type LeaveFlags = { leaveDay?: boolean; leaveType?: string | null } | null | undefined;

/** A work-from-home day — show it as WFH, and let hours be entered. Ignores leaveDay. */
export function isWfhDay(day: LeaveFlags): boolean {
  return isWorkingLeaveType(day?.leaveType);
}

/** A full-day leave that locks time entry: any leave day except a WFH one. */
export function isBlockingLeaveDay(day: LeaveFlags): boolean {
  return !!day?.leaveDay && !isWorkingLeaveType(day.leaveType);
}
