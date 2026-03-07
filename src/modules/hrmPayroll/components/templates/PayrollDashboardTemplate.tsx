'use client';

import React from 'react';
import styles from '../../styles/PayrollDashboard.module.css';

interface PayrollDashboardTemplateProps {
  kpiSection: React.ReactNode;
  pipelineSection: React.ReactNode;
  alertsSection: React.ReactNode;
  runsTableSection: React.ReactNode;
}

const PayrollDashboardTemplate: React.FC<PayrollDashboardTemplateProps> = ({
  kpiSection,
  pipelineSection,
  alertsSection,
  runsTableSection,
}) => {
  return (
    <div className={styles.dashboard}>
      <div className={styles.kpiGrid}>{kpiSection}</div>
      <div style={{ marginBottom: 16 }}>{pipelineSection}</div>
      <div style={{ marginBottom: 16 }}>{alertsSection}</div>
      <div>{runsTableSection}</div>
    </div>
  );
};

export default PayrollDashboardTemplate;
