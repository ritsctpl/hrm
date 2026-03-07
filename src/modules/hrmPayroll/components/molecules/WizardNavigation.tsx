'use client';

import React from 'react';
import { Button, Space } from 'antd';
import type { WizardNavigationProps } from '../../types/ui.types';
import styles from '../../styles/PayrollWizard.module.css';

const WizardNavigation: React.FC<WizardNavigationProps> = ({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  isNextLoading = false,
  isNextDisabled = false,
  nextLabel,
}) => {
  const isLast = currentStep >= totalSteps - 1;
  const label = nextLabel ?? (isLast ? 'Finish' : 'Next');

  return (
    <div className={styles.wizardNav}>
      <Button
        onClick={onBack}
        disabled={currentStep === 0}
      >
        Back
      </Button>
      <Space>
        <Button
          type="primary"
          onClick={onNext}
          loading={isNextLoading}
          disabled={isNextDisabled}
        >
          {label}
        </Button>
      </Space>
    </div>
  );
};

export default WizardNavigation;
