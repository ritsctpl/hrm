'use client';

import { useHrmAppraisalStore } from "../stores/hrmAppraisalStore";

export function useAppraisalReview() {
  const {
    myReview,
    loadingReview,
    submittingAssessment,
    fetchMyReview,
    submitSelfAssessment,
    submitPeerFeedback,
  } = useHrmAppraisalStore();

  return {
    myReview,
    loadingReview,
    submittingAssessment,
    fetchMyReview,
    submitSelfAssessment,
    submitPeerFeedback,
  };
}
