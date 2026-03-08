"use client";

import { useCallback, useState } from "react";
import { parseCookies } from "nookies";
import { HrmExpenseService } from "../services/hrmExpenseService";
import type { MileageCalculateResponse } from "../types/api.types";

export function useMileageCalculator() {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
  const [calculating, setCalculating] = useState(false);

  const calculateAmount = useCallback(async (distanceKm: number, categoryId: string = "CAT-MILEAGE"): Promise<MileageCalculateResponse | null> => {
    if (!distanceKm || distanceKm <= 0) return null;
    setCalculating(true);
    try {
      return await HrmExpenseService.calculateMileage({ site, categoryId, distanceKm });
    } catch {
      return null;
    } finally {
      setCalculating(false);
    }
  }, [site]);

  return { calculateAmount, calculating };
}
