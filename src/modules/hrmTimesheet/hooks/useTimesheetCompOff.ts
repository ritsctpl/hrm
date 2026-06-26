'use client';
// Comp-off overlay for the timesheet — resolves the employee's APPROVED/CREDITED
// comp-off requests for the given year and maps each by its workedDate. A holiday
// the employee actually worked (and earned a comp-off for) is unlocked for time
// entry on that one date. Mirrors useTimesheetTravel; unlike travel this overlay
// also drives editability (see WeeklyMatrixGrid.dayEditable), not just an icon.
import { useCallback, useEffect, useState } from 'react';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmLeaveService } from '../../hrmLeave/services/hrmLeaveService';
import type { CompOffRequest } from '../../hrmLeave/types/api.types';
import { useEmployeeIdentity } from '../../hrmAccess/hooks/useEmployeeIdentity';

/** Short human label for an unlocked worked-holiday's tooltip. */
function labelFor(c: CompOffRequest): string {
  return c.hours ? `Comp-off: worked holiday (${c.hours}h)` : 'Comp-off: worked holiday';
}

export function useTimesheetCompOff(year: number) {
  const [map, setMap] = useState<Map<string, string>>(new Map());
  // The comp-off endpoint is indexed on the composite "<code> - <name>" id, the
  // same value HrmLeaveLanding sends. Using the bare employeeCode returns an
  // empty list with no error, so we use employeeIdWithName and gate on isReady.
  const { employeeIdWithName, isReady } = useEmployeeIdentity();

  const fetchCompOffs = useCallback(async () => {
    const organizationId = getOrganizationId();
    if (!organizationId || !year || !employeeIdWithName) return;
    try {
      const list = await HrmLeaveService.getMyCompOffRequests({
        organizationId,
        employeeId: employeeIdWithName,
      });
      const next = new Map<string, string>();
      (list ?? [])
        .filter((c) => c.status === 'APPROVED' || c.status === 'CREDITED')
        .forEach((c) => {
          const date = c.workedDate?.slice(0, 10);
          if (date && date.slice(0, 4) === String(year)) next.set(date, labelFor(c));
        });
      setMap(next);
    } catch (err) {
      console.error('Failed to load comp-off for timesheet:', err);
    }
  }, [year, employeeIdWithName]);

  useEffect(() => {
    if (isReady) void fetchCompOffs();
  }, [fetchCompOffs, isReady]);

  const isCompOffDay = useCallback((date: string) => map.has(date), [map]);
  const getCompOffLabel = useCallback((date: string) => map.get(date), [map]);

  return { isCompOffDay, getCompOffLabel };
}
