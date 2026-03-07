'use client';

import { useHrmPayrollStore } from '../stores/payrollStore';
import type { PayrollAdjustmentDraft } from '../stores/payrollStore';

export function useLopAdjustments() {
  const store = useHrmPayrollStore();

  const saveLop = async () => {
    await store.saveLopInputs();
  };

  const saveAdj = async () => {
    await store.saveAdjustments();
  };

  return {
    includedEmployeeIds: store.includedEmployeeIds,
    lopInputs: store.lopInputs,
    adjustments: store.adjustments,
    updateLop: store.updateLopInput,
    addAdjustment: (adj: PayrollAdjustmentDraft) => store.addAdjustment(adj),
    removeAdjustment: store.removeAdjustment,
    saveLop,
    saveAdj,
  };
}
