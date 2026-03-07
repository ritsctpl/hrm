'use client';

import React from 'react';
import { Drawer, Descriptions, Card, Table, Statistic, Typography, Tag, Space } from 'antd';
import type { PayrollEntry, PayrollComponentValue } from '../../types/domain.types';
import EntryStatusTag from '../atoms/EntryStatusTag';
import { formatINR } from '../../utils/payrollFormatters';
import styles from '../../styles/PayrollReview.module.css';

const { Text } = Typography;

interface EmployeePayrollModalProps {
  entry: PayrollEntry | null;
  open: boolean;
  onClose: () => void;
}

const componentColumns = [
  { title: 'Component', dataIndex: 'componentName', key: 'componentName', ellipsis: true },
  {
    title: 'Monthly',
    dataIndex: 'monthlyAmount',
    key: 'monthlyAmount',
    align: 'right' as const,
    render: (v: number) => (v != null ? `₹${formatINR(v)}` : '--'),
  },
  {
    title: 'Prorated',
    dataIndex: 'proratedAmount',
    key: 'proratedAmount',
    align: 'right' as const,
    render: (v: number) => `₹${formatINR(v)}`,
  },
];

const deductionColumns = [
  { title: 'Component', dataIndex: 'componentName', key: 'componentName', ellipsis: true },
  {
    title: 'Amount',
    dataIndex: 'proratedAmount',
    key: 'proratedAmount',
    align: 'right' as const,
    render: (v: number) => `₹${formatINR(v)}`,
  },
];

const EmployeePayrollModal: React.FC<EmployeePayrollModalProps> = ({ entry, open, onClose }) => {
  if (!entry) return null;

  const earnings = entry.earnings.filter((e) => e.componentType === 'EARNING');
  const deductions = entry.deductions.filter((d) => d.componentType === 'DEDUCTION');
  const adjustments = entry.adjustments ?? [];

  return (
    <Drawer
      title={
        <Space>
          <span>{entry.employeeName}</span>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {entry.employeeId}
          </Text>
          <EntryStatusTag status={entry.status} />
        </Space>
      }
      open={open}
      onClose={onClose}
      width={720}
      destroyOnClose
    >
      {/* Employee Info */}
      <Descriptions size="small" bordered column={2} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Department">{entry.department ?? '--'}</Descriptions.Item>
        <Descriptions.Item label="Working Days">{entry.workingDays ?? '--'}</Descriptions.Item>
        <Descriptions.Item label="LOP Days">{entry.lopDays ?? 0}</Descriptions.Item>
        <Descriptions.Item label="Paid Days">{entry.paidDays ?? '--'}</Descriptions.Item>
      </Descriptions>

      {/* Earnings & Deductions */}
      <div className={styles.modalComponentGrid}>
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
                <Table.Summary.Cell index={0} colSpan={2}><Text strong>Total Gross</Text></Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
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
            columns={deductionColumns}
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

      {/* Net Pay Summary */}
      <Card size="small" style={{ marginTop: 16 }}>
        <div className={styles.netPayRow}>
          <Statistic title="Gross Earnings" value={`₹${formatINR(entry.grossEarnings)}`} />
          <Statistic title="Total Deductions" value={`₹${formatINR(entry.totalDeductions)}`} valueStyle={{ color: '#ff4d4f' }} />
          <Statistic title="Net Pay" value={`₹${formatINR(entry.netPay)}`} valueStyle={{ color: '#1890ff', fontWeight: 700 }} />
        </div>
      </Card>

      {/* Adjustments */}
      {adjustments.length > 0 && (
        <Card title="Manual Adjustments" size="small" style={{ marginTop: 16 }}>
          {adjustments.map((adj, idx) => (
            <div key={idx} className={styles.adjustmentItem}>
              <Tag color={adj.adjustmentType === 'DEDUCTION' ? 'red' : 'green'}>
                {adj.adjustmentType}
              </Tag>
              <Text>{adj.description}</Text>
              <Text strong style={{ marginLeft: 'auto' }}>
                ₹{formatINR(adj.amount)}
              </Text>
            </div>
          ))}
        </Card>
      )}

      {/* Error Info */}
      {entry.status === 'ERROR' && entry.errorMessage && (
        <Card
          title={<Text type="danger">Error Details</Text>}
          size="small"
          style={{ marginTop: 16, borderColor: '#ff4d4f' }}
        >
          <Text type="danger">{entry.errorMessage}</Text>
        </Card>
      )}
    </Drawer>
  );
};

export default EmployeePayrollModal;
