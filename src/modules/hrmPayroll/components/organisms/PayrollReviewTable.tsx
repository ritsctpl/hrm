'use client';

import React from 'react';
import { Table, Button, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { PayrollEntry } from '../../types/domain.types';
import EmployeePayrollExpandedRow from '../molecules/EmployeePayrollExpandedRow';
import EntryStatusTag from '../atoms/EntryStatusTag';
import VarianceIndicator from '../atoms/VarianceIndicator';
import { formatINR, computeVariancePct } from '../../utils/payrollFormatters';
import styles from '../../styles/PayrollReview.module.css';

interface PayrollReviewTableProps {
  entries: PayrollEntry[];
  loading?: boolean;
  onViewDetails?: (entry: PayrollEntry) => void;
}

const PayrollReviewTable: React.FC<PayrollReviewTableProps> = ({
  entries,
  loading,
  onViewDetails,
}) => {
  const columns: ColumnsType<PayrollEntry> = [
    { title: 'Emp ID', dataIndex: 'employeeId', key: 'employeeId', width: 90 },
    { title: 'Name', dataIndex: 'employeeName', key: 'employeeName', ellipsis: true },
    { title: 'Dept', dataIndex: 'department', key: 'department', width: 100, ellipsis: true },
    {
      title: 'Working Days',
      dataIndex: 'workingDays',
      key: 'workingDays',
      align: 'center',
      width: 100,
      render: (v: number) => v ?? '--',
    },
    {
      title: 'LOP',
      dataIndex: 'lopDays',
      key: 'lopDays',
      align: 'center',
      width: 70,
      render: (v: number) => v ?? '--',
    },
    {
      title: 'Gross',
      dataIndex: 'grossEarnings',
      key: 'grossEarnings',
      align: 'right',
      width: 110,
      render: (v: number) =>
        v != null ? (
          <span style={{ color: '#52c41a' }}>₹{formatINR(v)}</span>
        ) : (
          '--'
        ),
    },
    {
      title: 'Deductions',
      dataIndex: 'totalDeductions',
      key: 'totalDeductions',
      align: 'right',
      width: 110,
      render: (v: number) =>
        v != null ? (
          <span style={{ color: '#ff4d4f' }}>₹{formatINR(v)}</span>
        ) : (
          '--'
        ),
    },
    {
      title: 'Net Pay',
      dataIndex: 'netPay',
      key: 'netPay',
      align: 'right',
      width: 110,
      render: (v: number) =>
        v != null ? <strong>₹{formatINR(v)}</strong> : '--',
    },
    {
      title: 'Variance',
      key: 'variance',
      align: 'center',
      width: 90,
      render: (_: unknown, record: PayrollEntry) =>
        record.netPay != null && record.previousNetPay != null ? (
          <VarianceIndicator current={record.netPay} previous={record.previousNetPay} />
        ) : (
          <Tag>--</Tag>
        ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_: unknown, record: PayrollEntry) => <EntryStatusTag status={record.status} />,
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: PayrollEntry) =>
        onViewDetails ? (
          <Button
            size="small"
            type="link"
            onClick={() => onViewDetails(record)}
          >
            Details
          </Button>
        ) : null,
    },
  ];

  const totalGross = entries.reduce((s, e) => s + (e.grossEarnings ?? 0), 0);
  const totalDeductions = entries.reduce((s, e) => s + (e.totalDeductions ?? 0), 0);
  const totalNet = entries.reduce((s, e) => s + (e.netPay ?? 0), 0);
  const highVarianceCount = entries.filter(
    (e) => e.netPay != null && e.previousNetPay != null && Math.abs(computeVariancePct(e.netPay, e.previousNetPay)) >= 20
  ).length;

  return (
    <Table<PayrollEntry>
      dataSource={entries}
      columns={columns}
      rowKey="employeeId"
      size="small"
      loading={loading}
      pagination={{ pageSize: 15, showSizeChanger: true }}
      scroll={{ y: 420, x: 'max-content' }}
      rowClassName={(record) => (record.status === 'ERROR' ? styles.errorRow : '')}
      expandable={{
        expandedRowRender: (record) => <EmployeePayrollExpandedRow entry={record} />,
        rowExpandable: (record) => record.status !== 'ERROR',
      }}
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={5}>
              <strong>
                {entries.length} employees
                {highVarianceCount > 0 && ` · ${highVarianceCount} high variance`}
              </strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={5} align="right">
              <strong style={{ color: '#52c41a' }}>₹{formatINR(totalGross)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={6} align="right">
              <strong style={{ color: '#ff4d4f' }}>₹{formatINR(totalDeductions)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={7} align="right">
              <strong>₹{formatINR(totalNet)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={8} colSpan={3} />
          </Table.Summary.Row>
        </Table.Summary>
      )}
      locale={{ emptyText: 'Select a payroll run to view entries.' }}
    />
  );
};

export default PayrollReviewTable;
