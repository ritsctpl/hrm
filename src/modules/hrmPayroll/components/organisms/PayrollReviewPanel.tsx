'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Select, Input, Button, Space } from 'antd';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import { useHrmPayrollStore } from '../../stores/payrollStore';
import PayrollReviewTable from './PayrollReviewTable';
import EmployeePayrollModal from './EmployeePayrollModal';
import PayrollStatusTag from '../atoms/PayrollStatusTag';
import type { PayrollEntry } from '../../types/domain.types';
import { formatPayrollPeriod, computeVariancePct } from '../../utils/payrollFormatters';
import styles from '../../styles/PayrollReview.module.css';

type StatusFilter = 'ALL' | 'COMPUTED' | 'ERROR' | 'ADJUSTED' | 'LOCKED';
type VarianceFilter = 'ALL' | 'gt5' | 'gt10' | 'gt20';

const PayrollReviewPanel: React.FC = () => {
  const store = useHrmPayrollStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [varianceFilter, setVarianceFilter] = useState<VarianceFilter>('ALL');
  const [modalEntry, setModalEntry] = useState<PayrollEntry | null>(null);

  const currentRun = store.allRuns.find((r) => r.runId === store.reviewRunId) ?? null;

  useEffect(() => {
    if (store.allRuns.length > 0 && !store.reviewRunId) {
      const first = store.allRuns[0];
      store.setReviewRunId(first.runId);
      store.fetchReviewEntries(first.runId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.allRuns]);

  const handleRunChange = (runId: string) => {
    store.setReviewRunId(runId);
    store.fetchReviewEntries(runId);
  };

  const filteredEntries = useMemo(() => {
    let rows = store.reviewEntries;

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (e) =>
          e.employeeId.toLowerCase().includes(q) ||
          e.employeeName.toLowerCase().includes(q) ||
          (e.department ?? '').toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'ALL') {
      rows = rows.filter((e) => e.status === statusFilter);
    }

    if (varianceFilter !== 'ALL') {
      const threshold = varianceFilter === 'gt5' ? 5 : varianceFilter === 'gt10' ? 10 : 20;
      rows = rows.filter(
        (e) =>
          e.netPay != null &&
          e.previousNetPay != null &&
          Math.abs(computeVariancePct(e.netPay, e.previousNetPay)) >= threshold
      );
    }

    return rows;
  }, [store.reviewEntries, search, statusFilter, varianceFilter]);

  const runOptions = store.allRuns.map((r) => ({
    value: r.runId,
    label: `${r.runId} — ${formatPayrollPeriod(r.payrollYear, r.payrollMonth)}`,
  }));

  return (
    <div className={styles.reviewPanel}>
      {/* Run Selector */}
      <div className={styles.reviewHeader}>
        <Space>
          <Select
            value={store.reviewRunId ?? undefined}
            onChange={handleRunChange}
            options={runOptions}
            style={{ width: 320 }}
            placeholder="Select payroll run..."
          />
          {currentRun && <PayrollStatusTag status={currentRun.status} />}
        </Space>
        <Space>
          <Button icon={<FileDownloadIcon fontSize="small" />} size="small">
            Export Excel
          </Button>
          <Button icon={<PrintIcon fontSize="small" />} size="small">
            Print
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <div className={styles.filterBar}>
        <Input.Search
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 220 }}
          allowClear
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 150 }}
          options={[
            { value: 'ALL', label: 'All Statuses' },
            { value: 'COMPUTED', label: 'Computed' },
            { value: 'ERROR', label: 'Errors' },
            { value: 'ADJUSTED', label: 'Adjusted' },
            { value: 'LOCKED', label: 'Locked' },
          ]}
        />
        <Select
          value={varianceFilter}
          onChange={setVarianceFilter}
          style={{ width: 150 }}
          options={[
            { value: 'ALL', label: 'Any Variance' },
            { value: 'gt5', label: '> 5%' },
            { value: 'gt10', label: '> 10%' },
            { value: 'gt20', label: '> 20%' },
          ]}
        />
      </div>

      {/* Table */}
      <PayrollReviewTable
        entries={filteredEntries}
        loading={store.reviewLoading}
        onViewDetails={(entry) => {
          store.selectEntry(entry);
          setModalEntry(entry);
        }}
      />

      {/* Employee Detail Modal */}
      <EmployeePayrollModal
        entry={modalEntry}
        open={!!modalEntry}
        onClose={() => {
          setModalEntry(null);
          store.selectEntry(null);
        }}
      />
    </div>
  );
};

export default PayrollReviewPanel;
