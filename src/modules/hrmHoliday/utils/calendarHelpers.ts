/**
 * HRM Holiday Module - Calendar Helpers
 */

import type { Holiday } from '../types/domain.types';

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  holidays: Holiday[];
}

export function buildMonthGrid(year: number, month: number, holidays: Holiday[]): CalendarDay[][] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const today = new Date(new Date().toDateString());

  const grid: CalendarDay[][] = [];
  const startPad = firstDay.getDay(); // 0=Sun
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;

  const holidayMap = new Map<string, Holiday[]>();
  holidays.forEach((h) => {
    const key = h.date.substring(0, 10);
    if (!holidayMap.has(key)) holidayMap.set(key, []);
    holidayMap.get(key)!.push(h);
  });

  let week: CalendarDay[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - startPad;
    const date = new Date(year, month - 1, 1 + dayOffset);
    const isCurrentMonth = date.getMonth() === month - 1;
    const dateKey = date.toISOString().substring(0, 10);

    week.push({
      date,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday: date.getTime() === today.getTime(),
      isPast: date < today,
      holidays: isCurrentMonth ? (holidayMap.get(dateKey) ?? []) : [],
    });

    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }

  return grid;
}

export function getHolidaysForMonth(holidays: Holiday[], year: number, month: number): Holiday[] {
  return holidays.filter((h) => {
    const d = new Date(h.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}
