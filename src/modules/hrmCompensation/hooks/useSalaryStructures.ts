'use client';

import { useEffect, useCallback } from 'react';
import { useHrmCompensationStore } from '../stores/compensationStore';
import type { SalaryStructure } from '../types/domain.types';

export function useSalaryStructures() {
  const salaryStructures = useHrmCompensationStore((s) => s.salaryStructures);
  const selectedStructure = useHrmCompensationStore((s) => s.selectedStructure);
  const structuresLoading = useHrmCompensationStore((s) => s.structuresLoading);
  const fetchSalaryStructures = useHrmCompensationStore((s) => s.fetchSalaryStructures);
  const selectStructure = useHrmCompensationStore((s) => s.selectStructure);
  const saveSalaryStructure = useHrmCompensationStore((s) => s.saveSalaryStructure);

  useEffect(() => {
    if (salaryStructures.length === 0) {
      fetchSalaryStructures();
    }
  }, []);

  const handleSelect = useCallback(
    (structure: SalaryStructure | null) => {
      selectStructure(structure);
    },
    [selectStructure],
  );

  const handleNew = useCallback(() => {
    selectStructure(null);
  }, [selectStructure]);

  const handleSave = useCallback(
    async (structure: SalaryStructure) => {
      await saveSalaryStructure(structure);
    },
    [saveSalaryStructure],
  );

  const handleRefresh = useCallback(() => {
    fetchSalaryStructures();
  }, [fetchSalaryStructures]);

  return {
    salaryStructures,
    selectedStructure,
    structuresLoading,
    handleSelect,
    handleNew,
    handleSave,
    handleRefresh,
  };
}
