'use client';

import { useCallback } from 'react';
import { useHrmCompensationStore } from '../stores/compensationStore';
import type { EmployeeCompensationRequest } from '../types/api.types';

export function useEmployeeCompensation() {
  const selectedEmployeeId = useHrmCompensationStore((s) => s.selectedEmployeeId);
  const currentCompensation = useHrmCompensationStore((s) => s.currentCompensation);
  const compensationHistory = useHrmCompensationStore((s) => s.compensationHistory);
  const previewCompensation = useHrmCompensationStore((s) => s.previewCompensation);
  const assignmentLoading = useHrmCompensationStore((s) => s.assignmentLoading);
  const setSelectedEmployeeId = useHrmCompensationStore((s) => s.setSelectedEmployeeId);
  const loadEmployeeCompensation = useHrmCompensationStore((s) => s.loadEmployeeCompensation);
  const fetchCompensationHistory = useHrmCompensationStore((s) => s.fetchCompensationHistory);
  const runPreview = useHrmCompensationStore((s) => s.runPreview);
  const saveCompensationDraft = useHrmCompensationStore((s) => s.saveCompensationDraft);
  const submitCompensationForApproval = useHrmCompensationStore(
    (s) => s.submitCompensationForApproval,
  );

  const handleSelectEmployee = useCallback(
    async (employeeId: string) => {
      setSelectedEmployeeId(employeeId);
      await Promise.all([
        loadEmployeeCompensation(employeeId),
        fetchCompensationHistory(employeeId),
      ]);
    },
    [setSelectedEmployeeId, loadEmployeeCompensation, fetchCompensationHistory],
  );

  const handlePreview = useCallback(
    async (req: EmployeeCompensationRequest) => {
      await runPreview(req);
    },
    [runPreview],
  );

  const handleSaveDraft = useCallback(
    async (req: EmployeeCompensationRequest) => {
      await saveCompensationDraft(req);
      if (selectedEmployeeId) {
        await loadEmployeeCompensation(selectedEmployeeId);
      }
    },
    [saveCompensationDraft, loadEmployeeCompensation, selectedEmployeeId],
  );

  const handleSubmitForApproval = useCallback(
    async (handle: string) => {
      await submitCompensationForApproval(handle);
    },
    [submitCompensationForApproval],
  );

  return {
    selectedEmployeeId,
    currentCompensation,
    compensationHistory,
    previewCompensation,
    assignmentLoading,
    handleSelectEmployee,
    handlePreview,
    handleSaveDraft,
    handleSubmitForApproval,
  };
}
