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

  console.log('buildMonthGrid called:', { year, month, holidaysCount: holidays.length, holidays });

  const grid: CalendarDay[][] = [];
  const startPad = firstDay.getDay(); // 0=Sun
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;

  // Build holiday map with normalized date keys (YYYY-MM-DD)
  const holidayMap = new Map<string, Holiday[]>();
  holidays.forEach((h) => {
    // Normalize the date to YYYY-MM-DD format
    const holidayDate = new Date(h.date);
    const key = `${holidayDate.getFullYear()}-${String(holidayDate.getMonth() + 1).padStart(2, '0')}-${String(holidayDate.getDate()).padStart(2, '0')}`;
    console.log('Holiday date mapping:', { originalDate: h.date, parsedDate: holidayDate, key, name: h.name });
    if (!holidayMap.has(key)) holidayMap.set(key, []);
    holidayMap.get(key)!.push(h);
  });

  console.log('Holiday map:', Array.from(holidayMap.entries()));

  let week: CalendarDay[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - startPad;
    const date = new Date(year, month - 1, 1 + dayOffset);
    const isCurrentMonth = date.getMonth() === month - 1;
    // Create normalized date key for comparison
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    const dayHolidays = isCurrentMonth ? (holidayMap.get(dateKey) ?? []) : [];
    if (dayHolidays.length > 0) {
      console.log('Found holidays for date:', { dateKey, date, holidays: dayHolidays });
    }

    week.push({
      date,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday: date.getTime() === today.getTime(),
      isPast: date < today,
      holidays: dayHolidays,
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
