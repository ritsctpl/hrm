'use client';

import React, { useState } from 'react';
import { Card, Descriptions, Alert, Button, Popconfirm, Steps, Input, Space, Typography } from 'antd';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LockIcon from '@mui/icons-material/Lock';
import PublishIcon from '@mui/icons-material/Publish';
import { useHrmPayrollStore } from '../../stores/payrollStore';
import { formatINR, formatPayrollPeriod } from '../../utils/payrollFormatters';
import styles from '../../styles/PayrollWizard.module.css';

const { Text } = Typography;

const STATUS_ORDER = ['DRAFT', 'PROCESSING', 'COMPUTED', 'APPROVED', 'PAID', 'LOCKED'];

const WizardStepApprove: React.FC = () => {
  const store = useHrmPayrollStore();
  const [remarks, setRemarks] = useState('');
  const run = store.wizardRunSummary;

  const currentStatus = run?.status ?? 'DRAFT';
  const statusIndex = STATUS_ORDER.indexOf(currentStatus);
  const isApproved = statusIndex >= 2;
  const isFinalized = statusIndex >= 3;
  const isPublished = statusIndex >= 4;

  const approvalStep =
    isApproved ? 'finish' : 'process';
  const finalizeStep =
    isFinalized ? 'finish' : isApproved ? 'process' : 'wait';
  const publishStep =
    isPublished ? 'finish' : isFinalized ? 'process' : 'wait';

  if (!run) return null;

  return (
    <div className={styles.stepContent}>
      {/* Final Summary */}
      <Card title="Final Summary" className={styles.stepCard} style={{ marginBottom: 12 }}>
        <Descriptions bordered column={3} size="small">
          <Descriptions.Item label="Period">
            {formatPayrollPeriod(run.payrollYear, run.payrollMonth)}
          </Descriptions.Item>
          <Descriptions.Item label="Total Employees">{run.totalEmployees}</Descriptions.Item>
          <Descriptions.Item label="Pay Date">{run.payDate}</Descriptions.Item>
          <Descriptions.Item label="Gross Pay">₹{formatINR(run.totalGross ?? run.totalGrossEarnings ?? 0)}</Descriptions.Item>
          <Descriptions.Item label="Total Deductions">₹{formatINR(run.totalDeductions ?? 0)}</Descriptions.Item>
          <Descriptions.Item label="Net Pay">₹{formatINR(run.totalNet ?? run.totalNetPay ?? 0)}</Descriptions.Item>
        </Descriptions>
      </Card>

      {store.errorCount > 0 && (
        <Alert
          type="warning"
          message={`${store.errorCount} employee(s) have ERROR status and will be excluded from finalization.`}
          showIcon
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Approval Workflow */}
      <Card title="Approval Actions" className={styles.stepCard}>
        <Steps direction="vertical" size="small" current={statusIndex - 1}>
          {/* Step 1: Approve */}
          <Steps.Step
            title="Approve"
            status={approvalStep}
            icon={<CheckCircleOutlineIcon fontSize="small" />}
            description={
              isApproved ? (
                <Text type="success">Payroll approved</Text>
              ) : (
                <Space direction="vertical" style={{ marginTop: 8 }}>
                  <Input.TextArea
                    rows={2}
                    placeholder="Remarks (optional)"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    style={{ width: 360 }}
                    disabled={isApproved}
                  />
                  <Popconfirm
                    title="Approve Payroll"
                    description="Confirm approval of this payroll run?"
                    onConfirm={() => store.approveRun(remarks)}
                    okText="Approve"
                    cancelText="Cancel"
                  >
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlineIcon fontSize="small" />}
                      disabled={isApproved}
                    >
                      Approve Payroll
                    </Button>
                  </Popconfirm>
                </Space>
              )
            }
          />

          {/* Step 2: Finalize */}
          <Steps.Step
            title="Finalize (Lock)"
            status={finalizeStep}
            icon={<LockIcon fontSize="small" />}
            description={
              isFinalized ? (
                <Text type="success">Payroll finalized and locked</Text>
              ) : (
                <Popconfirm
                  title="Finalize Payroll"
                  description="This will lock the payroll run and prevent further modifications."
                  onConfirm={() => store.finalizeRun()}
                  okText="Finalize"
                  cancelText="Cancel"
                  disabled={!isApproved || isFinalized}
                >
                  <Button
                    type="primary"
                    icon={<LockIcon fontSize="small" />}
                    disabled={!isApproved || isFinalized}
                    style={{ marginTop: 8 }}
                  >
                    Finalize (Lock)
                  </Button>
                </Popconfirm>
              )
            }
          />

          {/* Step 3: Publish */}
          <Steps.Step
            title="Publish to Employees"
            status={publishStep}
            icon={<PublishIcon fontSize="small" />}
            description={
              isPublished ? (
                <Text type="success">Payroll published to employees</Text>
              ) : (
                <Popconfirm
                  title="Publish Payroll"
                  description="This will transfer payroll data to payslip generation. Cannot be undone."
                  onConfirm={() => store.publishRun()}
                  okText="Publish"
                  cancelText="Cancel"
                  disabled={!isFinalized || isPublished}
                >
                  <Button
                    type="primary"
                    icon={<PublishIcon fontSize="small" />}
                    disabled={!isFinalized || isPublished}
                    style={{ marginTop: 8 }}
                  >
                    Publish to Employees
                  </Button>
                </Popconfirm>
              )
            }
          />
        </Steps>
      </Card>
    </div>
  );
};

export default WizardStepApprove;
