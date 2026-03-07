'use client';

import { useHrmAppraisalStore } from "../stores/hrmAppraisalStore";

export function useAppraisalCalibration() {
  const {
    calibrationReviews,
    ratingDistribution,
    calibrationFilters,
    loadingCalibration,
    savingCalibration,
    fetchCalibrationReviews,
    fetchRatingDistribution,
    calibrateRating,
    finalizeCalibration,
    setCalibrationFilters,
  } = useHrmAppraisalStore();

  return {
    calibrationReviews,
    ratingDistribution,
    calibrationFilters,
    loadingCalibration,
    savingCalibration,
    fetchCalibrationReviews,
    fetchRatingDistribution,
    calibrateRating,
    finalizeCalibration,
    setCalibrationFilters,
  };
}
