'use client';

import { useEffect } from 'react';
import { useHrmPayrollStore } from '../stores/payrollStore';

export function usePayrollReview() {
  const store = useHrmPayrollStore();

  useEffect(() => {
    if (store.allRuns.length > 0 && !store.reviewRunId) {
      const firstRun = store.allRuns[0];
      store.setReviewRunId(firstRun.runId);
      store.fetchReviewEntries(firstRun.runId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.allRuns]);

  const selectRun = (runId: string) => {
    store.setReviewRunId(runId);
    store.fetchReviewEntries(runId);
  };

  return {
    allRuns: store.allRuns,
    reviewRunId: store.reviewRunId,
    entries: store.reviewEntries,
    loading: store.reviewLoading,
    selectedEntry: store.selectedEntry,
    selectRun,
    selectEntry: store.selectEntry,
  };
}
