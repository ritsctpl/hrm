'use client';

import React from 'react';
import { Alert, Space, Button } from 'antd';
import styles from '../../styles/PayrollDashboard.module.css';

interface AlertsPanelProps {
  missingCompensation: number;
  errorEmployees: number;
  pendingApprovals: number;
  onFix?: () => void;
  onView?: () => void;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({
  missingCompensation,
  errorEmployees,
  pendingApprovals,
  onFix,
  onView,
}) => {
  const hasAlerts = missingCompensation > 0 || errorEmployees > 0 || pendingApprovals > 0;

  if (!hasAlerts) return null;

  return (
    <div className={styles.alertsPanel}>
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        {missingCompensation > 0 && (
          <Alert
            type="warning"
            message={`${missingCompensation} employee(s) missing approved compensation data`}
            showIcon
            action={
              <Button size="small" onClick={onFix}>
                Fix
              </Button>
            }
          />
        )}
        {errorEmployees > 0 && (
          <Alert
            type="error"
            message={`${errorEmployees} employee(s) have ERROR status in the current run`}
            showIcon
            action={
              <Button size="small" onClick={onView}>
                View
              </Button>
            }
          />
        )}
        {pendingApprovals > 0 && (
          <Alert
            type="info"
            message={`${pendingApprovals} compensation approval(s) pending`}
            showIcon
            action={
              <Button size="small" onClick={onView}>
                View
              </Button>
            }
          />
        )}
      </Space>
    </div>
  );
};

export default AlertsPanel;
