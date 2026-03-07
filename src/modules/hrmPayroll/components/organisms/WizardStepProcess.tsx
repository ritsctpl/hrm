'use client';

import React, { useState } from 'react';
import { Card, Button, Progress, Statistic, Descriptions, Space, Typography, Alert } from 'antd';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useHrmPayrollStore } from '../../stores/payrollStore';
import { formatPayrollPeriod } from '../../utils/payrollFormatters';
import { PAYROLL_MONTHS } from '../../utils/payrollConstants';
import styles from '../../styles/PayrollWizard.module.css';

const { Text } = Typography;

const WizardStepProcess: React.FC = () => {
  const store = useHrmPayrollStore();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = store.wizardRunSummary;
  const monthLabel = run
    ? PAYROLL_MONTHS.find((m) => m.value === run.payrollMonth)?.label ?? String(run.payrollMonth)
    : '';

  const handleRun = async () => {
    setProcessing(true);
    setError(null);
    try {
      await store.startComputation();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Calculation failed. Please try again.';
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  const isComplete = store.computationProgress === 100;

  return (
    <div className={styles.stepContent}>
      {run && (
        <Card title="Run Details" className={styles.stepCard} style={{ marginBottom: 12 }}>
          <Descriptions column={3} size="small">
            <Descriptions.Item label="Run ID">{run.runId}</Descriptions.Item>
            <Descriptions.Item label="Period">
              {formatPayrollPeriod(run.payrollMonth, run.payrollYear, PAYROLL_MONTHS)}
            </Descriptions.Item>
            <Descriptions.Item label="Employees">
              {store.includedEmployeeIds.length || run.totalEmployees}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card title="Payroll Calculation" className={styles.stepCard}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Button
            type="primary"
            size="large"
            icon={<PlayArrowIcon fontSize="small" />}
            onClick={handleRun}
            disabled={processing || isComplete}
            loading={processing}
          >
            {processing ? 'Processing...' : isComplete ? 'Calculation Complete' : 'Run Calculation'}
          </Button>

          {error && (
            <Alert type="error" message={error} showIcon />
          )}

          {(processing || store.computationProgress > 0) && (
            <>
              <Progress
                percent={store.computationProgress}
                status={processing ? 'active' : isComplete ? 'success' : 'normal'}
                strokeColor={processing ? '#1890ff' : '#52c41a'}
              />

              {processing && (
                <Text type="secondary">
                  Processing employees...
                </Text>
              )}

              <div className={styles.statsGrid}>
                <Statistic
                  title="Processed"
                  value={store.processedCount}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Statistic
                  title="Errors"
                  value={store.errorCount}
                  valueStyle={{ color: store.errorCount > 0 ? '#ff4d4f' : undefined }}
                />
                <Statistic
                  title="Remaining"
                  value={store.remainingCount}
                />
              </div>

              {isComplete && store.errorCount > 0 && (
                <Alert
                  type="warning"
                  message={`${store.errorCount} employee(s) encountered errors during calculation. Review in the next step.`}
                  showIcon
                />
              )}

              {isComplete && store.errorCount === 0 && (
                <Alert
                  type="success"
                  message={`All ${store.processedCount} employees processed successfully.`}
                  showIcon
                />
              )}
            </>
          )}

          {!processing && store.computationProgress === 0 && (
            <Text type="secondary">
              Click &ldquo;Run Calculation&rdquo; to process payroll for {monthLabel} {run?.payrollYear}.
              This will compute gross earnings, deductions, and net pay for all included employees.
            </Text>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default WizardStepProcess;
