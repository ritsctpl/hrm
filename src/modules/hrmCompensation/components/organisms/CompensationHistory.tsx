'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button, DatePicker, Empty, Input, Space, Spin, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import SearchIcon from '@mui/icons-material/Search';
import EventIcon from '@mui/icons-material/Event';
import dayjs, { type Dayjs } from 'dayjs';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import { HrmCompensationService } from '../../services/compensationService';
import type { EmployeeCompensationResponse } from '../../types/domain.types';
import CompensationStatusTag from '../atoms/CompensationStatusTag';
import CurrencyCell from '../atoms/CurrencyCell';
import styles from '../../styles/Compensation.module.css';

const CompensationHistory: React.FC = () => {
  const compensationHistory = useHrmCompensationStore((s) => s.compensationHistory);
  const fetchCompensationHistory = useHrmCompensationStore((s) => s.fetchCompensationHistory);
  const pendingApprovals = useHrmCompensationStore((s) => s.pendingApprovals);

  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [asOfDate, setAsOfDate] = useState<Dayjs | null>(null);
  const [asOfRecord, setAsOfRecord] = useState<EmployeeCompensationResponse | null>(null);

  // Quick-pick employees we already know about (from the approvals queue).
  const knownEmployees = useMemo(() => {
    const seen = new Map<string, string>();
    pendingApprovals.forEach((p) => {
      if (p.employeeId && !seen.has(p.employeeId)) seen.set(p.employeeId, p.employeeName);
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [pendingApprovals]);

  const runSearch = useCallback(
    async (id: string) => {
      const trimmed = id.trim();
      if (!trimmed) {
        message.info('Enter an employee ID to view its compensation history');
        return;
      }
      setLoading(true);
      setSearched(true);
      setAsOfRecord(null);
      try {
        await fetchCompensationHistory(trimmed);
      } catch {
        message.error('Failed to load compensation history');
      } finally {
        setLoading(false);
      }
    },
    [fetchCompensationHistory],
  );

  const runAsOf = useCallback(async () => {
    const trimmed = employeeId.trim();
    if (!trimmed || !asOfDate) {
      message.info('Pick an employee and an as-of date');
      return;
    }
    setLoading(true);
    try {
      const rec = await HrmCompensationService.getCompensationOnDate(
        getOrganizationId(),
        trimmed,
        asOfDate.format('YYYY-MM-DD'),
      );
      setAsOfRecord(rec ?? null);
      if (!rec) message.info('No compensation effective on that date');
    } catch {
      message.error('No compensation found for that date');
      setAsOfRecord(null);
    } finally {
      setLoading(false);
    }
  }, [employeeId, asOfDate]);

  const columns: ColumnsType<EmployeeCompensationResponse> = [
    {
      title: 'Effective From',
      dataIndex: 'effectiveFrom',
      key: 'effectiveFrom',
      render: (v: string) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</span>,
      sorter: (a, b) => (a.effectiveFrom ?? '').localeCompare(b.effectiveFrom ?? ''),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Rev #',
      dataIndex: 'revisionNumber',
      key: 'revisionNumber',
      width: 80,
      render: (v: number) => <Tag>{v ?? 0}</Tag>,
    },
    {
      title: 'Structure',
      dataIndex: 'structureCode',
      key: 'structureCode',
      render: (v: string) => v || '—',
    },
    {
      title: 'Monthly CTC',
      dataIndex: 'monthlyCTC',
      key: 'monthlyCTC',
      align: 'right',
      render: (v: number) => <CurrencyCell value={v} colored />,
    },
    {
      title: 'Annual CTC',
      dataIndex: 'annualCTC',
      key: 'annualCTC',
      align: 'right',
      render: (v: number) => <CurrencyCell value={v} />,
    },
    {
      title: 'Net Pay',
      dataIndex: 'netPay',
      key: 'netPay',
      align: 'right',
      render: (v: number) => <CurrencyCell value={v} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <CompensationStatusTag status={v} />,
    },
  ];

  return (
    <div className={styles.history}>
      <header className={styles.overviewHeader}>
        <div>
          <Typography.Title level={4} className={styles.overviewTitle}>
            Compensation history
          </Typography.Title>
          <Typography.Text className={styles.overviewSubtitle}>
            Full audit timeline for an employee — every revision, effective date and approval.
          </Typography.Text>
        </div>
      </header>

      <div className={styles.historyToolbar}>
        <Space.Compact style={{ maxWidth: 360, width: '100%' }}>
          <Input
            placeholder="Employee ID"
            value={employeeId}
            allowClear
            onChange={(e) => setEmployeeId(e.target.value)}
            onPressEnter={() => runSearch(employeeId)}
          />
          <Button
            type="primary"
            icon={<SearchIcon style={{ fontSize: 16 }} />}
            onClick={() => runSearch(employeeId)}
          >
            Search
          </Button>
        </Space.Compact>

        <Space.Compact>
          <DatePicker
            placeholder="As of date"
            value={asOfDate}
            onChange={(d) => setAsOfDate(d)}
            suffixIcon={<EventIcon style={{ fontSize: 16 }} />}
          />
          <Button onClick={runAsOf} disabled={!employeeId.trim() || !asOfDate}>
            Point-in-time
          </Button>
        </Space.Compact>
      </div>

      {knownEmployees.length > 0 && (
        <div className={styles.quickPicks}>
          <span className={styles.quickPicksLabel}>From approvals:</span>
          {knownEmployees.map((e) => (
            <button
              key={e.id}
              type="button"
              className={styles.quickPickChip}
              onClick={() => {
                setEmployeeId(e.id);
                runSearch(e.id);
              }}
            >
              {e.name} · {e.id}
            </button>
          ))}
        </div>
      )}

      {asOfRecord && (
        <div className={styles.asOfCard}>
          <div className={styles.asOfHeader}>
            <span>
              As of <strong>{asOfDate?.format('YYYY-MM-DD')}</strong> — {asOfRecord.employeeName}
            </span>
            <CompensationStatusTag status={asOfRecord.status} />
          </div>
          <div className={styles.asOfFigures}>
            <span>
              Monthly CTC <CurrencyCell value={asOfRecord.monthlyCTC} colored />
            </span>
            <span>
              Annual CTC <CurrencyCell value={asOfRecord.annualCTC} />
            </span>
            <span>Rev #{asOfRecord.revisionNumber}</span>
          </div>
        </div>
      )}

      <div className={styles.historyTableWrap}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin />
          </div>
        ) : !searched ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Search for an employee to view their compensation history"
            style={{ margin: '48px 0' }}
          />
        ) : (
          <Table<EmployeeCompensationResponse>
            rowKey={(r) => r.handle}
            columns={columns}
            dataSource={compensationHistory}
            size="small"
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            locale={{ emptyText: 'No compensation history for this employee' }}
          />
        )}
      </div>
    </div>
  );
};

export default CompensationHistory;
