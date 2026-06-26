'use client';
// Holiday overlay for the timesheet — resolves company holidays from
// /holiday/retrieve-all (via HrmHolidayService.getAllHolidayDates) so holiday
// days can be coloured and locked from time entry. Scoped to the employee's BU
// when the buHandle cookie is present, otherwise all groups.
import { useCallback, useEffect, useState } from 'react';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmHolidayService } from '../../hrmHoliday/services/hrmHolidayService';

export function useTimesheetHolidays(year: number) {
  const [map, setMap] = useState<Map<string, string>>(new Map());

  const fetchHolidays = useCallback(async () => {
    const organizationId = getOrganizationId();
    if (!organizationId || !year) return;
    const cookies = parseCookies();
    try {
      const result = await HrmHolidayService.getAllHolidayDates({
        organizationId,
        year,
        requestingUserRole: cookies.userRole ?? 'EMPLOYEE',
        buHandle: cookies.buHandle || undefined,
      });
      setMap(result);
    } catch (err) {
      console.error('Failed to load holidays for timesheet:', err);
    }
  }, [year]);

  useEffect(() => {
    void fetchHolidays();
  }, [fetchHolidays]);

  const isHoliday = useCallback((date: string) => map.has(date), [map]);
  const getHolidayName = useCallback((date: string) => map.get(date), [map]);

  return { isHoliday, getHolidayName };
}
