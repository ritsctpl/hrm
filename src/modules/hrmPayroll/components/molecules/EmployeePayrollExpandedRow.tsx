'use client';

import React from 'react';
import { Card, Table, Typography } from 'antd';
import type { PayrollEntry, PayrollComponentValue } from '../../types/domain.types';
import { formatINR } from '../../utils/payrollFormatters';
import styles from '../../styles/PayrollReview.module.css';

const { Text } = Typography;

interface EmployeePayrollExpandedRowProps {
  entry: PayrollEntry;
}

const componentColumns = [
  { title: 'Component', dataIndex: 'componentName', key: 'componentName', ellipsis: true },
  {
    title: 'Amount',
    dataIndex: 'proratedAmount',
    key: 'proratedAmount',
    align: 'right' as const,
    render: (v: number) => `₹${formatINR(v)}`,
  },
];

const EmployeePayrollExpandedRow: React.FC<EmployeePayrollExpandedRowProps> = ({ entry }) => {
  const earnings = entry.earnings.filter((e) => e.componentType === 'EARNING');
  const deductions = entry.deductions.filter((d) => d.componentType === 'DEDUCTION');

  return (
    <div className={styles.expandedRow}>
      <Card
        title={<Text style={{ color: '#52c41a' }}>Earnings</Text>}
        size="small"
        className={styles.expandedCard}
      >
        <Table<PayrollComponentValue>
          dataSource={earnings}
          columns={componentColumns}
          rowKey="componentCode"
          pagination={false}
          size="small"
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}><Text strong>Total Gross</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong>₹{formatINR(entry.grossEarnings)}</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>

      <Card
        title={<Text style={{ color: '#ff4d4f' }}>Deductions</Text>}
        size="small"
        className={styles.expandedCard}
      >
        <Table<PayrollComponentValue>
          dataSource={deductions}
          columns={componentColumns}
          rowKey="componentCode"
          pagination={false}
          size="small"
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}><Text strong>Total Deductions</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong>₹{formatINR(entry.totalDeductions)}</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>
    </div>
  );
};

export default EmployeePayrollExpandedRow;
