'use client';

import { useHrmPayrollStore } from '../stores/payrollStore';

export function usePayrollProgress() {
  const store = useHrmPayrollStore();

  const start = async () => {
    await store.startComputation();
  };

  return {
    progress: store.computationProgress,
    processedCount: store.processedCount,
    errorCount: store.errorCount,
    remainingCount: store.remainingCount,
    isComplete: store.computationProgress === 100,
    start,
  };
}
