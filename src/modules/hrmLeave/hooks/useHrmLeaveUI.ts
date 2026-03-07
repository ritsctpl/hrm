"use client";

import { useCallback } from "react";
import { useHrmLeaveStore } from "../stores/hrmLeaveStore";
import { LeaveRequest } from "../types/domain.types";

export function useHrmLeaveUI() {
  const {
    activeTab,
    activeHrTab,
    showLeaveForm,
    leaveFormStep,
    leaveFormState,
    showRejectModal,
    showReassignModal,
    pendingActionRequestId,
    selectedRequest,
    setActiveTab,
    setActiveHrTab,
    openLeaveForm,
    closeLeaveForm,
    setLeaveFormStep,
    updateLeaveFormState,
    openRejectModal,
    closeRejectModal,
    openReassignModal,
    closeReassignModal,
    setSelectedRequest,
  } = useHrmLeaveStore();

  const handleTabChange = useCallback(
    (tab: string) => setActiveTab(tab),
    [setActiveTab]
  );

  const handleHrTabChange = useCallback(
    (tab: string) => setActiveHrTab(tab),
    [setActiveHrTab]
  );

  const handleSelectRequest = useCallback(
    (request: LeaveRequest | null) => setSelectedRequest(request),
    [setSelectedRequest]
  );

  const handleNextFormStep = useCallback(() => {
    const next = Math.min(leaveFormStep + 1, 4) as 1 | 2 | 3 | 4;
    setLeaveFormStep(next);
  }, [leaveFormStep, setLeaveFormStep]);

  const handlePrevFormStep = useCallback(() => {
    const prev = Math.max(leaveFormStep - 1, 1) as 1 | 2 | 3 | 4;
    setLeaveFormStep(prev);
  }, [leaveFormStep, setLeaveFormStep]);

  return {
    activeTab,
    activeHrTab,
    showLeaveForm,
    leaveFormStep,
    leaveFormState,
    showRejectModal,
    showReassignModal,
    pendingActionRequestId,
    selectedRequest,
    handleTabChange,
    handleHrTabChange,
    handleSelectRequest,
    handleNextFormStep,
    handlePrevFormStep,
    openLeaveForm,
    closeLeaveForm,
    updateLeaveFormState,
    openRejectModal,
    closeRejectModal,
    openReassignModal,
    closeReassignModal,
  };
}
