'use client';

import React, { useEffect } from 'react';
import { Card, Button, Typography } from 'antd';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useHrmPayrollStore } from '../../stores/payrollStore';
import PayrollSummaryCard from '../molecules/PayrollSummaryCard';
import StatusPipeline from './StatusPipeline';
import AlertsPanel from './AlertsPanel';
import PayrollRunsTable from './PayrollRunsTable';
import PayrollStatusTag from '../atoms/PayrollStatusTag';
import Can from '../../../hrmAccess/components/Can';
import { formatINR, formatPayrollPeriod, computeVariancePct } from '../../utils/payrollFormatters';
import type { PayrollRunSummary } from '../../types/domain.types';
import styles from '../../styles/PayrollDashboard.module.css';

const { Text } = Typography;

const PayrollDashboard: React.FC = () => {
  const store = useHrmPayrollStore();

  useEffect(() => {
    store.fetchAllRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = store.currentRun;

  const handleResumeWizard = (run: PayrollRunSummary) => {
    store.setWizardRunId(run.runId);
    store.setWizardStep(1);
    store.setActiveTab('run');
  };

  const handleViewReview = (run: PayrollRunSummary) => {
    store.setReviewRunId(run.runId);
    store.fetchReviewEntries(run.runId);
    store.setActiveTab('review');
  };

  const prevRun = store.allRuns[1] ?? null;

  return (
    <div className={styles.dashboard}>
      {/* Current Run Banner */}
      {current && (
        <Card className={styles.currentRunCard} style={{ marginBottom: 16 }}>
          <div className={styles.currentRunRow}>
            <div>
              <Text strong style={{ fontSize: 16 }}>
                {formatPayrollPeriod(current.payrollYear, current.payrollMonth)}
              </Text>
              <Text type="secondary" style={{ marginLeft: 12 }}>
                {current.runId}
              </Text>
              <span style={{ marginLeft: 12 }}>
                <PayrollStatusTag status={current.status} />
              </span>
              {current.payDate && (
                <Text type="secondary" style={{ marginLeft: 12, fontSize: 13 }}>
                  Pay Date: {current.payDate}
                </Text>
              )}
            </div>
            <Can I="edit">
              <Button
                type="primary"
                icon={<ArrowForwardIcon fontSize="small" />}
                onClick={() => handleResumeWizard(current)}
              >
                Run Payroll Wizard
              </Button>
            </Can>
          </div>
        </Card>
      )}

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <PayrollSummaryCard
          title="Total Employees"
          value={current?.totalEmployees ?? 0}
          variance={
            prevRun && current
              ? computeVariancePct(current.totalEmployees, prevRun.totalEmployees)
              : undefined
          }
        />
        <PayrollSummaryCard
          title="Gross Pay"
          value={current ? `₹${formatINR(current.totalGross ?? current.totalGrossEarnings ?? 0)}` : '₹0'}
          variance={
            prevRun && current
              ? computeVariancePct(
                  current.totalGross ?? current.totalGrossEarnings ?? 0,
                  prevRun.totalGross ?? prevRun.totalGrossEarnings ?? 0
                )
              : undefined
          }
        />
        <PayrollSummaryCard
          title="Total Deductions"
          value={current ? `₹${formatINR(current.totalDeductions ?? 0)}` : '₹0'}
          variance={
            prevRun && current
              ? computeVariancePct(current.totalDeductions ?? 0, prevRun.totalDeductions ?? 0)
              : undefined
          }
          valueColor="red"
        />
        <PayrollSummaryCard
          title="Net Pay"
          value={current ? `₹${formatINR(current.totalNet ?? current.totalNetPay ?? 0)}` : '₹0'}
          variance={
            prevRun && current
              ? computeVariancePct(
                  current.totalNet ?? current.totalNetPay ?? 0,
                  prevRun.totalNet ?? prevRun.totalNetPay ?? 0
                )
              : undefined
          }
          valueColor="blue"
        />
      </div>

      {/* Status Pipeline */}
      <Card title="Payroll Status Pipeline" className={styles.pipelineCard} style={{ marginBottom: 16 }}>
        <StatusPipeline currentStatus={current?.status} />
      </Card>

      {/* Alerts */}
      <div style={{ marginBottom: 16 }}>
        <AlertsPanel
          missingCompensation={current?.missingCompensation ?? 0}
          errorEmployees={current?.errorEmployees ?? 0}
          pendingApprovals={current?.pendingApprovals ?? 0}
          onFix={() => store.setActiveTab('run')}
          onView={() => store.setActiveTab('review')}
        />
      </div>

      {/* Recent Runs */}
      <Card title="Recent Payroll Runs" loading={store.dashboardLoading}>
        <PayrollRunsTable
          runs={store.allRuns}
          loading={store.dashboardLoading}
          onResumeWizard={handleResumeWizard}
          onViewReview={handleViewReview}
        />
      </Card>
    </div>
  );
};

export default PayrollDashboard;
