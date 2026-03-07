"use client";

import { useCallback, useState } from "react";
import { parseCookies } from "nookies";
import { HrmExpenseService } from "../services/hrmExpenseService";

export function useMileageCalculator() {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
  const [calculating, setCalculating] = useState(false);

  const calculateAmount = useCallback(async (distanceKm: number): Promise<{ amount: number; ratePerKm: number } | null> => {
    if (!distanceKm || distanceKm <= 0) return null;
    setCalculating(true);
    try {
      return await HrmExpenseService.calculateMileage({ site, distanceKm });
    } catch {
      return null;
    } finally {
      setCalculating(false);
    }
  }, [site]);

  return { calculateAmount, calculating };
}
