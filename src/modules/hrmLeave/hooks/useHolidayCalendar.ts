'use client';

import { useState, useEffect, useCallback } from 'react';
import { HrmHolidayService } from '@/modules/hrmHoliday/services/hrmHolidayService';
import { getOrganizationId } from '@/utils/cookieUtils';
import { parseCookies } from 'nookies';

interface HolidayDate {
  date: string;
  name: string;
}

/**
 * Fetches published holidays for the employee's BU and caches them.
 * Used by DateRangePicker and Calendar views to highlight holidays.
 */
export function useHolidayCalendar(year?: number, month?: number) {
  const [holidays, setHolidays] = useState<HolidayDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [holidayDatesSet, setHolidayDatesSet] = useState<Set<string>>(new Set());

  const fetchHolidays = useCallback(async () => {
    const organizationId = getOrganizationId();
    if (!organizationId) return;

    const cookies = parseCookies();
    const buHandle = cookies.buHandle ?? '';

    setLoading(true);
    try {
      let allHolidays: HolidayDate[] = [];

      if (buHandle) {
        // Use the BU-scoped integration endpoint for published holidays
        const res = await HrmHolidayService.getPublishedHolidaysForBu({
          organizationId,
          buHandle,
          year: year ?? new Date().getFullYear(),
        });
        const list = res?.data ?? [];
        allHolidays = (Array.isArray(list) ? list : []).map((h) => ({
          date: h.date,
          name: h.name,
        }));
      } else {
        // Fallback: use calendar view endpoint to fetch all holidays
        const res = await HrmHolidayService.getCalendarView({
          organizationId,
          year: year ?? new Date().getFullYear(),
          requestingUserRole: 'EMPLOYEE',
        });
        const list = res?.data?.holidays ?? [];
        allHolidays = (Array.isArray(list) ? list : []).map((h) => ({
          date: h.date,
          name: h.name,
        }));
      }

      // If month filter provided, filter to that month
      let filtered = allHolidays;
      if (year && month) {
        const prefix = `${year}-${String(month).padStart(2, '0')}`;
        filtered = allHolidays.filter((h) => h.date.startsWith(prefix));
      }

      setHolidays(filtered);
      setHolidayDatesSet(new Set(filtered.map((h) => h.date)));
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const isHoliday = useCallback(
    (date: string) => holidayDatesSet.has(date),
    [holidayDatesSet],
  );

  const getHolidayName = useCallback(
    (date: string) => {
      return holidays.find((h) => h.date === date)?.name;
    },
    [holidays],
  );

  return { holidays, loading, isHoliday, getHolidayName, holidayDatesSet };
}
