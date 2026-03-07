'use client';

import { useHrmAppraisalStore } from "../stores/hrmAppraisalStore";

export function useAppraisalPip() {
  const { activePip } = useHrmAppraisalStore();
  return { activePip };
}
