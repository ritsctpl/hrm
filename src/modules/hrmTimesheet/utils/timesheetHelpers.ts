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
