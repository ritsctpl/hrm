'use client';

import { useCallback } from 'react';
import { useHrmCompensationStore } from '../stores/compensationStore';
import type { SalaryRevisionRow } from '../types/domain.types';

export function useSalaryRevision() {
  const revisionMode = useHrmCompensationStore((s) => s.revisionMode);
  const revisionRows = useHrmCompensationStore((s) => s.revisionRows);
  const revisionLoading = useHrmCompensationStore((s) => s.revisionLoading);
  const selectedRevisionIds = useHrmCompensationStore((s) => s.selectedRevisionIds);
  const setRevisionMode = useHrmCompensationStore((s) => s.setRevisionMode);
  const setRevisionRows = useHrmCompensationStore((s) => s.setRevisionRows);
  const setSelectedRevisionIds = useHrmCompensationStore((s) => s.setSelectedRevisionIds);
  const submitBulkRevision = useHrmCompensationStore((s) => s.submitBulkRevision);

  const handleIncrementChange = useCallback(
    (employeeId: string, newPercent: number) => {
      const updated = revisionRows.map((r: SalaryRevisionRow) => {
        if (r.employeeId !== employeeId) return r;
        const newBasic = Math.round(r.currentBasic * (1 + newPercent / 100));
        const grossRatio = r.currentBasic > 0 ? r.currentGross / r.currentBasic : 1;
        return {
          ...r,
          incrementPercent: newPercent,
          newBasic,
          newGross: Math.round(newBasic * grossRatio),
        };
      });
      setRevisionRows(updated);
    },
    [revisionRows, setRevisionRows],
  );

  const handleSelectAll = useCallback(() => {
    setSelectedRevisionIds(revisionRows.map((r) => r.employeeId));
  }, [revisionRows, setSelectedRevisionIds]);

  const handleClearSelection = useCallback(() => {
    setSelectedRevisionIds([]);
  }, [setSelectedRevisionIds]);

  const handleSubmitBulk = useCallback(async () => {
    await submitBulkRevision();
  }, [submitBulkRevision]);

  return {
    revisionMode,
    revisionRows,
    revisionLoading,
    selectedRevisionIds,
    setRevisionMode,
    setRevisionRows,
    handleIncrementChange,
    handleSelectAll,
    handleClearSelection,
    handleSubmitBulk,
  };
}
