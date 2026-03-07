'use client';

import { useMemo } from 'react';
import { useHrmCompensationStore } from '../stores/compensationStore';
import type { PayComponent } from '../types/domain.types';

export function useHrmCompensationUI() {
  const store = useHrmCompensationStore();

  const earningsComponents = useMemo(
    () => store.payComponents.filter((c: PayComponent) => c.componentType === 'EARNING' && c.active === 1),
    [store.payComponents],
  );

  const deductionComponents = useMemo(
    () => store.payComponents.filter((c: PayComponent) => c.componentType === 'DEDUCTION' && c.active === 1),
    [store.payComponents],
  );

  const approvalsBadgeCount = store.pendingApprovals.length;

  const isComponentSelected = !!store.selectedComponent;
  const isStructureSelected = !!store.selectedStructure;
  const isEmployeeSelected = !!store.selectedEmployeeId;

  return {
    earningsComponents,
    deductionComponents,
    approvalsBadgeCount,
    isComponentSelected,
    isStructureSelected,
    isEmployeeSelected,
    activeTab: store.activeTab,
    componentsLoading: store.componentsLoading,
    structuresLoading: store.structuresLoading,
    assignmentLoading: store.assignmentLoading,
    approvalsLoading: store.approvalsLoading,
  };
}
