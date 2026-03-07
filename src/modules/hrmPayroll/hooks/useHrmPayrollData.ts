'use client';

import { useCallback } from 'react';
import { useHrmPayrollStore } from '../stores/payrollStore';

export function useHrmPayrollData() {
  const store = useHrmPayrollStore();

  const loadDashboard = useCallback(async () => {
    await store.fetchAllRuns();
  }, [store]);

  const loadReviewEntries = useCallback(async (runId: string) => {
    store.setReviewRunId(runId);
    await store.fetchReviewEntries(runId);
  }, [store]);

  const loadTaxConfig = useCallback(async (financialYearStart: number, regime: 'OLD' | 'NEW' = 'NEW') => {
    await store.fetchTaxConfig(financialYearStart, regime);
  }, [store]);

  const loadStatutoryConfigs = useCallback(async () => {
    await Promise.all([
      store.fetchStatutoryConfig('PF'),
      store.fetchStatutoryConfig('ESI'),
      store.fetchStatutoryConfig('PT'),
    ]);
  }, [store]);

  const initialLoad = useCallback(async () => {
    await store.fetchAllRuns();
  }, [store]);

  return {
    loadDashboard,
    loadReviewEntries,
    loadTaxConfig,
    loadStatutoryConfigs,
    initialLoad,
  };
}
