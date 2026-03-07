'use client';

import { useHrmPayrollStore } from '../stores/payrollStore';
import type { WizardStep } from '../stores/payrollStore';

export function usePayrollWizard() {
  const store = useHrmPayrollStore();

  const canAdvance = (): boolean => {
    switch (store.wizardStep) {
      case 0:
        return !!store.wizardRunId;
      case 3:
        return store.computationProgress === 100;
      default:
        return true;
    }
  };

  const goNext = () => {
    if (store.wizardStep < 5 && canAdvance()) {
      store.setWizardStep((store.wizardStep + 1) as WizardStep);
    }
  };

  const goBack = () => {
    if (store.wizardStep > 0) {
      store.setWizardStep((store.wizardStep - 1) as WizardStep);
    }
  };

  const finish = () => {
    store.setActiveTab('dashboard');
    store.setWizardStep(0);
  };

  return {
    step: store.wizardStep,
    runId: store.wizardRunId,
    runSummary: store.wizardRunSummary,
    canAdvance,
    goNext,
    goBack,
    finish,
  };
}
