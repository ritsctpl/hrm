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

/** Returns the Monday of the week containing the given date. */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
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

/** Sunday of the week containing the given date (PRD weeks run Sun→Sat). */
export function sundayOf(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - d.getDay());
  return ymd(d);
}

/** The 7 dates (Sun→Sat) of the week containing `dateStr`. */
export function weekDates(dateStr: string): string[] {
  const start = sundayOf(dateStr);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Sunday of the week `delta` whole weeks away from the week containing `dateStr`.
 * `delta` of 0 normalises to the current week's Sunday, so callers can use this as the
 * single way to express "the week I am on" and "the week next to it".
 */
export function shiftWeekStart(dateStr: string, delta: number): string {
  return addDays(sundayOf(dateStr), delta * 7);
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
 * Builds the month calendar grid as full Sun→Sat weeks covering `monthStart`
 * (YYYY-MM-01). Leading/trailing cells from adjacent months are included so
 * every row has 7 days; `inMonth` flags which belong to the displayed month.
 */
export function buildMonthMatrix(monthStart: string): { date: string; inMonth: boolean }[][] {
  const first = new Date(monthStart);
  const year = first.getFullYear();
  const month = first.getMonth();
  const gridStart = new Date(sundayOf(ymd(first)));
  const weeks: { date: string; inMonth: boolean }[][] = [];
  const cursor = new Date(gridStart);
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

/** 1-based index of the week (within its month) that `dateStr` falls in. */
export function weekOfMonthIndex(dateStr: string): number {
  const d = new Date(dateStr);
  const monthFirst = new Date(d.getFullYear(), d.getMonth(), 1);
  const firstSunday = new Date(sundayOf(ymd(monthFirst)));
  const diffDays = Math.round((new Date(sundayOf(dateStr)).getTime() - firstSunday.getTime()) / 86400000);
  return Math.floor(diffDays / 7) + 1;
}
