"use client";

import { useCallback, useState } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { parseCookies } from "nookies";
import { HrmExpenseService } from "../services/hrmExpenseService";
import type { MileageCalculateResponse } from "../types/api.types";

export function useMileageCalculator() {
  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const [calculating, setCalculating] = useState(false);

  const calculateAmount = useCallback(async (distanceKm: number, categoryId: string = "CAT-MILEAGE"): Promise<MileageCalculateResponse | null> => {
    if (!distanceKm || distanceKm <= 0) return null;
    setCalculating(true);
    try {
      return await HrmExpenseService.calculateMileage({ organizationId, categoryId, distanceKm });
    } catch {
      return null;
    } finally {
      setCalculating(false);
    }
  }, [organizationId]);

  return { calculateAmount, calculating };
}
