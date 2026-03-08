'use client';

import React from 'react';
import { Steps } from 'antd';
import type { PayrollRunStatus } from '../../types/domain.types';
import styles from '../../styles/PayrollDashboard.module.css';

interface StatusPipelineProps {
  currentStatus: PayrollRunStatus | undefined;
}

const STATUS_STEPS: { key: PayrollRunStatus; label: string }[] = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'COMPUTED', label: 'Computed' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'PAID', label: 'Paid' },
  { key: 'LOCKED', label: 'Locked' },
];

const StatusPipeline: React.FC<StatusPipelineProps> = ({ currentStatus }) => {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className={styles.pipeline}>
      <Steps
        current={currentIndex}
        items={STATUS_STEPS.map((s) => ({ title: s.label }))}
        size="small"
        progressDot
      />
    </div>
  );
};

export default StatusPipeline;
