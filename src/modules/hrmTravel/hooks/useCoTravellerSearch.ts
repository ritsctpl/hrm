"use client";

import { useCallback } from "react";
import { parseCookies } from "nookies";
import { HrmTravelService } from "../services/hrmTravelService";
import { useHrmTravelStore } from "../stores/hrmTravelStore";

export function useCoTravellerSearch() {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
  const employeeId = cookies.employeeId ?? cookies.userId ?? cookies.user ?? cookies.rl_user_id ?? "";

  const { setEligibleCoTravellers, setCoTravellerSearchLoading } = useHrmTravelStore();

  const searchCoTravellers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setEligibleCoTravellers([]);
      return;
    }
    setCoTravellerSearchLoading(true);
    try {
      const data = await HrmTravelService.searchCoTravellers({
        site,
        empId: employeeId,
        query,
      });
      setEligibleCoTravellers(data);
    } catch {
      setEligibleCoTravellers([]);
    } finally {
      setCoTravellerSearchLoading(false);
    }
  }, [site, employeeId]);

  return { searchCoTravellers };
}
