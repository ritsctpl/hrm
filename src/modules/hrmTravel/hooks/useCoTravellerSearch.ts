"use client";

import { useCallback, useRef } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { message } from "antd";
import { HrmTravelService } from "../services/hrmTravelService";
import { useHrmTravelStore } from "../stores/hrmTravelStore";
import { useEmployeeIdentity } from "../../hrmAccess/hooks/useEmployeeIdentity";

export function useCoTravellerSearch() {
  const organizationId = getOrganizationId();
  const identity = useEmployeeIdentity();
  // Backend filters eligible co-travellers by bare employeeCode (same supervisor),
  // not composite or email.
  const employeeId = identity.employeeCode;

  const { setEligibleCoTravellers, setCoTravellerSearchLoading } = useHrmTravelStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchCoTravellers = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setEligibleCoTravellers([]);
      return;
    }

    if (!identity.isReady || !employeeId) {
      message.error("Employee identity still loading — try again in a moment.");
      return;
    }

    // Debounce — wait 300ms after last keystroke
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCoTravellerSearchLoading(true);
      try {
        const data = await HrmTravelService.searchCoTravellers({ organizationId,
          empId: employeeId,
          query: trimmed,
        });
        setEligibleCoTravellers(data);
      } catch {
        setEligibleCoTravellers([]);
      } finally {
        setCoTravellerSearchLoading(false);
      }
    }, 300);
  }, [organizationId, employeeId, identity.isReady, setEligibleCoTravellers, setCoTravellerSearchLoading]);

  return { searchCoTravellers };
}
