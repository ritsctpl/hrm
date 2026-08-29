'use client';

import React from 'react';
import { Steps } from 'antd';
import { useHrmPayrollStore } from '../../stores/payrollStore';
import { WIZARD_STEPS } from '../../utils/payrollConstants';
import WizardStepSelectMonth from './WizardStepSelectMonth';
import WizardStepSelectGroup from './WizardStepSelectGroup';
import WizardStepReviewInputs from './WizardStepReviewInputs';
import WizardStepReviewResults from './WizardStepReviewResults';
import WizardStepApprove from './WizardStepApprove';
import WizardNavigation from '../molecules/WizardNavigation';
import styles from '../../styles/PayrollWizard.module.css';

const STEP_COMPONENTS: React.FC[] = [
  WizardStepSelectMonth,
  WizardStepSelectGroup,
  WizardStepReviewInputs,
  WizardStepReviewResults,
  WizardStepApprove,
];

const PayrollWizard: React.FC = () => {
  const store = useHrmPayrollStore();
  const { wizardStep, setWizardStep } = store;

  const canGoNext = (): boolean => {
    // Creating the run computes it, so the only gate is that a run exists.
    if (wizardStep === 0) return !!store.wizardRunId;
    return true;
  };

  const handleNext = () => {
    if (wizardStep < WIZARD_STEPS.length - 1 && canGoNext()) {
      setWizardStep((wizardStep + 1) as 0 | 1 | 2 | 3 | 4);
    }
  };

  const handleBack = () => {
    if (wizardStep > 0) {
      setWizardStep((wizardStep - 1) as 0 | 1 | 2 | 3 | 4);
    }
  };

  const handleFinish = () => {
    store.setActiveTab('dashboard');
    store.setWizardStep(0);
  };

  const StepContent = STEP_COMPONENTS[wizardStep];

  return (
    <div className={styles.wizardContainer}>
      <Steps
        current={wizardStep}
        items={WIZARD_STEPS.map((s) => ({ title: s }))}
        className={styles.wizardSteps}
        size="small"
      />

      <div className={styles.wizardBody}>
        <StepContent />
      </div>

      <WizardNavigation
        currentStep={wizardStep}
        totalSteps={WIZARD_STEPS.length}
        onBack={handleBack}
        onNext={wizardStep < 5 ? handleNext : handleFinish}
        isNextDisabled={!canGoNext()}
      />
    </div>
  );
};

export default PayrollWizard;
