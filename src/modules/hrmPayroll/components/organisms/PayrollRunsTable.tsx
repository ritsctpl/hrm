'use client';

import React from 'react';
import { Table, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { PayrollRunSummary } from '../../types/domain.types';
import PayrollStatusTag from '../atoms/PayrollStatusTag';
import { formatINR, formatPayrollPeriod } from '../../utils/payrollFormatters';
import { PAYROLL_MONTHS } from '../../utils/payrollConstants';

interface PayrollRunsTableProps {
  runs: PayrollRunSummary[];
  loading?: boolean;
  onResumeWizard?: (run: PayrollRunSummary) => void;
  onViewReview?: (run: PayrollRunSummary) => void;
}

const PayrollRunsTable: React.FC<PayrollRunsTableProps> = ({
  runs,
  loading,
  onResumeWizard,
  onViewReview,
}) => {
  const columns: ColumnsType<PayrollRunSummary> = [
    { title: 'Run ID', dataIndex: 'runId', key: 'runId', width: 130 },
    {
      title: 'Period',
      key: 'period',
      render: (_: unknown, record: PayrollRunSummary) =>
        formatPayrollPeriod(record.payrollMonth, record.payrollYear, PAYROLL_MONTHS),
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_: unknown, record: PayrollRunSummary) => (
        <PayrollStatusTag status={record.status} />
      ),
    },
    {
      title: 'Employees',
      dataIndex: 'totalEmployees',
      key: 'totalEmployees',
      align: 'right',
      width: 100,
    },
    {
      title: 'Net Pay',
      dataIndex: 'totalNet',
      key: 'totalNet',
      align: 'right',
      width: 130,
      render: (v: number) => (v != null ? `₹${formatINR(v)}` : '--'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_: unknown, record: PayrollRunSummary) => (
        <>
          {record.status !== 'PUBLISHED' && record.status !== 'FINALIZED' && onResumeWizard && (
            <Button
              size="small"
              type="link"
              onClick={() => onResumeWizard(record)}
              style={{ padding: '0 4px' }}
            >
              Resume
            </Button>
          )}
          {onViewReview && (
            <Button
              size="small"
              type="link"
              onClick={() => onViewReview(record)}
              style={{ padding: '0 4px' }}
            >
              Review
            </Button>
          )}
        </>
      ),
    },
  ];

  return (
    <Table<PayrollRunSummary>
      dataSource={runs}
      columns={columns}
      rowKey="runId"
      size="small"
      loading={loading}
      pagination={false}
      scroll={{ y: 240 }}
      locale={{ emptyText: 'No payroll runs found.' }}
    />
  );
};

export default PayrollRunsTable;
