'use client';

import React, { useMemo, useState } from 'react';
import { Card, Input, Select, Button, Statistic, Table, Tag, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useHrmPayrollStore } from '../../stores/payrollStore';
import type { PayrollEntry } from '../../types/domain.types';
import EmployeePayrollExpandedRow from '../molecules/EmployeePayrollExpandedRow';
import EntryStatusTag from '../atoms/EntryStatusTag';
import VarianceIndicator from '../atoms/VarianceIndicator';
import { formatINR, computeVariancePct } from '../../utils/payrollFormatters';
import styles from '../../styles/PayrollWizard.module.css';

type FilterType = 'all' | 'errors' | 'highVariance';

const WizardStepReviewResults: React.FC = () => {
  const store = useHrmPayrollStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const run = store.wizardRunSummary;
  const entries = store.reviewEntries;

  const filtered = useMemo(() => {
    let rows = entries;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (e) =>
          e.employeeId.toLowerCase().includes(q) ||
          e.employeeName.toLowerCase().includes(q)
      );
    }
    if (filter === 'errors') {
      rows = rows.filter((e) => e.status === 'ERROR');
    } else if (filter === 'highVariance') {
      rows = rows.filter((e) => {
        const pct = Math.abs(computeVariancePct(e.netPay, e.previousNetPay));
        return pct >= 20;
      });
    }
    return rows;
  }, [entries, search, filter]);

  const columns: ColumnsType<PayrollEntry> = [
    { title: 'Emp ID', dataIndex: 'employeeId', key: 'employeeId', width: 90 },
    { title: 'Name', dataIndex: 'employeeName', key: 'employeeName', ellipsis: true },
    { title: 'Dept', dataIndex: 'department', key: 'department', width: 100, ellipsis: true },
    {
      title: 'Gross',
      dataIndex: 'grossEarnings',
      key: 'grossEarnings',
      align: 'right',
      width: 110,
      render: (v: number) => (v != null ? `₹${formatINR(v)}` : '--'),
    },
    {
      title: 'Deductions',
      dataIndex: 'totalDeductions',
      key: 'totalDeductions',
      align: 'right',
      width: 110,
      render: (v: number) => (v != null ? `₹${formatINR(v)}` : '--'),
    },
    {
      title: 'Net Pay',
      dataIndex: 'netPay',
      key: 'netPay',
      align: 'right',
      width: 110,
      render: (v: number) => (v != null ? <strong>₹{formatINR(v)}</strong> : '--'),
    },
    {
      title: 'Variance',
      key: 'variance',
      width: 90,
      align: 'center',
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
  ];

  const totalGross = entries.reduce((s, e) => s + (e.grossEarnings ?? 0), 0);
  const totalNet = entries.reduce((s, e) => s + (e.netPay ?? 0), 0);

  return (
    <div className={styles.stepContent}>
      {/* Summary stats */}
      <div className={styles.statsGrid} style={{ marginBottom: 12 }}>
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
          title="Gross Pay"
          value={`₹${formatINR(run?.totalGross ?? run?.totalGrossEarnings ?? totalGross)}`}
        />
        <Statistic
          title="Net Pay"
          value={`₹${formatINR(run?.totalNet ?? run?.totalNetPay ?? totalNet)}`}
        />
      </div>

      {store.errorCount > 0 && (
        <Alert
          type="warning"
          message={`${store.errorCount} employee(s) have errors and will be excluded from approval unless resolved.`}
          showIcon
          style={{ marginBottom: 12 }}
        />
      )}

      <Card
        className={styles.stepCard}
        title="Employee Results"
        extra={
          <Button
            size="small"
            icon={<FileDownloadIcon fontSize="small" />}
          >
            Export
          </Button>
        }
      >
        <div className={styles.filterBar}>
          <Input.Search
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            value={filter}
            onChange={setFilter}
            style={{ width: 160 }}
            options={[
              { value: 'all', label: 'All Employees' },
              { value: 'errors', label: 'Errors Only' },
              { value: 'highVariance', label: 'High Variance (>20%)' },
            ]}
          />
        </div>

        <Table<PayrollEntry>
          dataSource={filtered}
          columns={columns}
          rowKey="employeeId"
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ y: 320 }}
          rowClassName={(record) =>
            record.status === 'ERROR' ? styles.errorRow : ''
          }
          expandable={{
            expandedRowRender: (record) => <EmployeePayrollExpandedRow entry={record} />,
            rowExpandable: (record) => record.status !== 'ERROR',
          }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <strong>{entries.length} employees</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <strong>₹{formatINR(totalGross)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} />
                <Table.Summary.Cell index={5} align="right">
                  <strong>₹{formatINR(totalNet)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} colSpan={2} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
          locale={{ emptyText: 'No results. Run calculation first (Step 4).' }}
        />
      </Card>
    </div>
  );
};

export default WizardStepReviewResults;
