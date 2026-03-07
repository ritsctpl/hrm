'use client';

import React from 'react';
import { Steps } from 'antd';
import styles from '../../styles/PayrollWizard.module.css';

interface PayrollWizardTemplateProps {
  currentStep: number;
  stepLabels: string[];
  stepContent: React.ReactNode;
  navigationBar: React.ReactNode;
}

const PayrollWizardTemplate: React.FC<PayrollWizardTemplateProps> = ({
  currentStep,
  stepLabels,
  stepContent,
  navigationBar,
}) => {
  const stepItems = stepLabels.map((label) => ({ title: label }));

  return (
    <div className={styles.wizardContainer}>
      <div className={styles.wizardSteps}>
        <Steps current={currentStep} items={stepItems} size="small" />
      </div>
      <div className={styles.wizardBody}>{stepContent}</div>
      <div className={styles.wizardNav}>{navigationBar}</div>
    </div>
  );
};

export default PayrollWizardTemplate;
