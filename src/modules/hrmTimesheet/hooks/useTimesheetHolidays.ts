'use client';
// Holiday overlay for the timesheet — resolves the employee's effective
// holidays (their location's region group, else the General group) so holiday
// days can be coloured green and locked from time entry.
import { useCallback, useEffect, useState } from 'react';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmHolidayService } from '../../hrmHoliday/services/hrmHolidayService';
import { useEmployeeIdentity } from '../../hrmAccess/hooks/useEmployeeIdentity';

export function useTimesheetHolidays(year: number) {
  const [map, setMap] = useState<Map<string, string>>(new Map());
  const { employeeCode, isReady } = useEmployeeIdentity();

  const fetchHolidays = useCallback(async () => {
    const organizationId = getOrganizationId();
    if (!organizationId || !year || !employeeCode) return;
    try {
      // HL-BE-3: region group for the employee's location, else General.
      const res = await HrmHolidayService.getHolidaysForEmployee({
        organizationId,
        employeeId: employeeCode,
        year,
      });
      const data = (res as { data?: unknown })?.data ?? res;
      const holidays = (data as { holidays?: Array<{ date: string; name: string }> })?.holidays
        ?? (Array.isArray(data) ? (data as Array<{ date: string; name: string }>) : []);
      setMap(new Map(holidays.map((h) => [String(h.date).slice(0, 10), h.name])));
    } catch (err) {
      console.error('Failed to load holidays for timesheet:', err);
    }
  }, [year, employeeCode]);

  useEffect(() => {
    if (isReady) void fetchHolidays();
  }, [fetchHolidays, isReady]);

  const isHoliday = useCallback((date: string) => map.has(date), [map]);
  const getHolidayName = useCallback((date: string) => map.get(date), [map]);

  return { isHoliday, getHolidayName };
}
