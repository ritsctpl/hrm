'use client';

import { useHrmAppraisalStore } from "../stores/hrmAppraisalStore";

export function useAppraisalFeedback() {
  const { myFeedback, fetchMyFeedback } = useHrmAppraisalStore();

  return { myFeedback, fetchMyFeedback };
}
