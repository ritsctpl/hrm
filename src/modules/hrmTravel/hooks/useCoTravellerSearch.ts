"use client";

import { useCallback, useRef } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { parseCookies } from "nookies";
import { message } from "antd";
import { HrmTravelService } from "../services/hrmTravelService";
import { useHrmTravelStore } from "../stores/hrmTravelStore";

export function useCoTravellerSearch() {
  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const employeeId =
    cookies.empId        ??
    cookies.employeeId   ??
    cookies.employeeCode ??
    cookies.username     ??
    cookies.userId       ??
    cookies.user         ??
    cookies.rl_user_id   ??
    "";

  const { setEligibleCoTravellers, setCoTravellerSearchLoading } = useHrmTravelStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchCoTravellers = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setEligibleCoTravellers([]);
      return;
    }

    if (!employeeId) {
      message.error("Employee ID not found in session. Cannot search co-travellers.");
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
  }, [organizationId, employeeId, setEligibleCoTravellers, setCoTravellerSearchLoading]);

  return { searchCoTravellers };
}
