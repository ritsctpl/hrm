"use client";

import { useCallback, useRef } from "react";
import { parseCookies } from "nookies";
import { HrmTravelService } from "../services/hrmTravelService";
import { useHrmTravelStore } from "../stores/hrmTravelStore";

export function useCoTravellerSearch() {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
  const employeeId = cookies.employeeId ?? cookies.userId ?? cookies.user ?? cookies.rl_user_id ?? "";

  const { setEligibleCoTravellers, setCoTravellerSearchLoading } = useHrmTravelStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchCoTravellers = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setEligibleCoTravellers([]);
      return;
    }

    // Debounce — wait 300ms after last keystroke
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCoTravellerSearchLoading(true);
      try {
        const data = await HrmTravelService.searchCoTravellers({
          site,
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
  }, [site, employeeId, setEligibleCoTravellers, setCoTravellerSearchLoading]);

  return { searchCoTravellers };
}
