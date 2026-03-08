'use client';

import { useMemo } from 'react';
import { useHrmPayrollStore } from '../stores/payrollStore';
import type { PayrollRunSummary } from '../types/domain.types';

export function useHrmPayrollUI() {
  const store = useHrmPayrollStore();

  const latestRun = store.allRuns[0] ?? null;

  const runsByStatus = useMemo(() => {
    const map: Record<string, PayrollRunSummary[]> = {};
    store.allRuns.forEach((run) => {
      const key = run.status;
      if (!map[key]) map[key] = [];
      map[key].push(run);
    });
    return map;
  }, [store.allRuns]);

  const activeRunCount = useMemo(
    () => store.allRuns.filter((r) => !['LOCKED', 'CANCELLED'].includes(r.status)).length,
    [store.allRuns],
  );

  const canStartNewRun = useMemo(
    () => store.allRuns.every((r) => ['LOCKED', 'CANCELLED'].includes(r.status)),
    [store.allRuns],
  );

  const wizardIsActive = store.wizardRunId !== null;
  const currentWizardStep = store.wizardStep;

  return {
    latestRun,
    runsByStatus,
    activeRunCount,
    canStartNewRun,
    wizardIsActive,
    currentWizardStep,
    activeTab: store.activeTab,
    dashboardLoading: store.dashboardLoading,
    reviewLoading: store.reviewLoading,
    taxConfigLoading: store.taxConfigLoading,
  };
}
