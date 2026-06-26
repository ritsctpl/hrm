'use client';
// Travel overlay for the timesheet — resolves the employee's APPROVED travel
// requests for the given year and expands each into the dates it covers, so a
// travel icon can be shown on those days. Mirrors useTimesheetHolidays; unlike
// holidays/leave this is an indicator only and never locks time entry.
import { useCallback, useEffect, useState } from 'react';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmTravelService } from '../../hrmTravel/services/hrmTravelService';
import type { TravelRequest } from '../../hrmTravel/types/domain.types';
import { useEmployeeIdentity } from '../../hrmAccess/hooks/useEmployeeIdentity';

/** Local YYYY-MM-DD (avoids the UTC shift toISOString can introduce). */
function ymd(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Short human label for a travel day's tooltip. */
function labelFor(t: TravelRequest): string {
  const dest = [t.destinationCity, t.destinationState].filter(Boolean).join(', ');
  if (dest && t.purpose) return `Travel: ${dest} — ${t.purpose}`;
  if (dest) return `Travel: ${dest}`;
  return t.purpose ? `Travel: ${t.purpose}` : 'Travel';
}

/** Expand an approved request into the ISO dates it covers (start..end inclusive,
 *  falling back to the single travelDate). */
function datesOf(t: TravelRequest): Array<[string, string]> {
  const label = labelFor(t);
  const start = t.startDate ?? t.travelDate;
  const end = t.endDate ?? t.startDate ?? t.travelDate;
  if (!start) return [];
  const out: Array<[string, string]> = [];
  const cursor = new Date(start.slice(0, 10));
  const last = new Date((end ?? start).slice(0, 10));
  // Guard against inverted / malformed ranges (cap at 366 iterations).
  for (let i = 0; cursor <= last && i < 366; i++) {
    out.push([ymd(cursor), label]);
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function useTimesheetTravel(year: number) {
  const [map, setMap] = useState<Map<string, string>>(new Map());
  const { employeeCode, isReady } = useEmployeeIdentity();

  const fetchTravel = useCallback(async () => {
    const organizationId = getOrganizationId();
    if (!organizationId || !year || !employeeCode) return;
    try {
      // my-requests matches records by bare employeeCode (not composite id).
      const list = await HrmTravelService.getMyRequests({
        organizationId,
        employeeId: employeeCode,
        status: 'APPROVED',
      });
      const next = new Map<string, string>();
      (list ?? [])
        .filter((t) => t.status === 'APPROVED')
        .forEach((t) =>
          datesOf(t).forEach(([date, label]) => {
            if (date.slice(0, 4) === String(year)) next.set(date, label);
          }),
        );
      setMap(next);
    } catch (err) {
      console.error('Failed to load travel for timesheet:', err);
    }
  }, [year, employeeCode]);

  useEffect(() => {
    if (isReady) void fetchTravel();
  }, [fetchTravel, isReady]);

  const isTravelDay = useCallback((date: string) => map.has(date), [map]);
  const getTravelLabel = useCallback((date: string) => map.get(date), [map]);

  return { isTravelDay, getTravelLabel };
}
