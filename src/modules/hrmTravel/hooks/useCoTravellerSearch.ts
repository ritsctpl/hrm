"use client";

import { useCallback } from "react";
import { parseCookies } from "nookies";
import { HrmTravelService } from "../services/hrmTravelService";
import { useHrmTravelStore } from "../stores/hrmTravelStore";

export function useCoTravellerSearch() {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
  const employeeId = cookies.userId ?? "";

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
        supervisorId: employeeId,
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
