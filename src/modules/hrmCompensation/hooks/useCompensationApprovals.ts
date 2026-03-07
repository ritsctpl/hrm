'use client';

import { useEffect, useCallback } from 'react';
import { useHrmCompensationStore } from '../stores/compensationStore';

export function useCompensationApprovals() {
  const pendingApprovals = useHrmCompensationStore((s) => s.pendingApprovals);
  const approvalsLoading = useHrmCompensationStore((s) => s.approvalsLoading);
  const fetchPendingApprovals = useHrmCompensationStore((s) => s.fetchPendingApprovals);
  const approveCompensation = useHrmCompensationStore((s) => s.approveCompensation);
  const rejectCompensation = useHrmCompensationStore((s) => s.rejectCompensation);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const handleApprove = useCallback(
    async (handle: string, remarks: string) => {
      await approveCompensation(handle, remarks);
    },
    [approveCompensation],
  );

  const handleReject = useCallback(
    async (handle: string, reason: string) => {
      await rejectCompensation(handle, reason);
    },
    [rejectCompensation],
  );

  const handleRefresh = useCallback(() => {
    fetchPendingApprovals();
  }, [fetchPendingApprovals]);

  return {
    pendingApprovals,
    approvalsLoading,
    handleApprove,
    handleReject,
    handleRefresh,
  };
}
