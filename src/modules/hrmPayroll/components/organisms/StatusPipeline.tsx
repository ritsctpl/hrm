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
  { key: 'VALIDATED', label: 'Validated' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'FINALIZED', label: 'Finalized' },
  { key: 'PUBLISHED', label: 'Published' },
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
