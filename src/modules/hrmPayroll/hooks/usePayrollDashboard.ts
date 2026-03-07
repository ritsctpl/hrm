'use client';

import { useEffect } from 'react';
import { useHrmPayrollStore } from '../stores/payrollStore';

export function usePayrollDashboard() {
  const store = useHrmPayrollStore();

  useEffect(() => {
    store.fetchAllRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    allRuns: store.allRuns,
    currentRun: store.currentRun,
    loading: store.dashboardLoading,
    refresh: store.fetchAllRuns,
  };
}
