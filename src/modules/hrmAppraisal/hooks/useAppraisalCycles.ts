'use client';

import { useEffect } from "react";
import { useHrmAppraisalStore } from "../stores/hrmAppraisalStore";

export function useAppraisalCycles() {
  const { cycles, activeCycle, loadingCycles, fetchCycles } = useHrmAppraisalStore();

  useEffect(() => {
    if (cycles.length === 0 && !loadingCycles) {
      fetchCycles();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { cycles, activeCycle, loadingCycles };
}
