'use client';

import { useCallback } from 'react';
import { useHrmCompensationStore } from '../stores/compensationStore';

export function useHrmCompensationData() {
  const store = useHrmCompensationStore();

  const loadComponents = useCallback(async () => {
    await store.fetchPayComponents();
  }, [store]);

  const loadStructures = useCallback(async () => {
    await store.fetchSalaryStructures();
  }, [store]);

  const loadPendingApprovals = useCallback(async () => {
    await store.fetchPendingApprovals();
  }, [store]);

  const loadEmployeeData = useCallback(async (employeeId: string) => {
    store.setSelectedEmployeeId(employeeId);
    await Promise.all([
      store.loadEmployeeCompensation(employeeId),
      store.fetchCompensationHistory(employeeId),
    ]);
  }, [store]);

  const initialLoad = useCallback(async () => {
    await Promise.all([
      store.fetchPayComponents(),
      store.fetchSalaryStructures(),
    ]);
  }, [store]);

  return {
    loadComponents,
    loadStructures,
    loadPendingApprovals,
    loadEmployeeData,
    initialLoad,
  };
}
