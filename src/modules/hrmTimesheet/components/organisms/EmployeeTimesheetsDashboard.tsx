'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button, Empty, Input, Modal, Segmented, Select, Space, Spin, Typography } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, LeftOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import { useHrmTimesheetData } from '../../hooks/useHrmTimesheetData';
import { useHrmTimesheetUI } from '../../hooks/useHrmTimesheetUI';
import WeekNavigator from '../molecules/WeekNavigator';
import { decimalToHHMM } from '../../utils/timesheetHelpers';
import ApprovalGate from '../atoms/ApprovalGate';
import type { TeamTimesheetSummary } from '../../types/domain.types';
import type { ManagerStatusFilter } from '../../types/ui.types';
import styles from '../../styles/TimesheetCalendar.module.css';

const { Text } = Typography;

type CardStatus = 'FOR_APPROVAL' | 'NO_ENTRY' | 'APPROVED' | 'REJECTED' | 'DRAFT' | 'ON_LEAVE';

const STATUS_OPTIONS: { label: string; value: ManagerStatusFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'For Approval', value: 'FOR_APPROVAL' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Blocked', value: 'BLOCKED' },
  { label: 'Enabled', value: 'ENABLED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'On Leave', value: 'ON_LEAVE' },
];

function deriveStatus(emp: TeamTimesheetSummary): CardStatus {
  const days = emp.weeklyData ?? [];
  const withHours = days.filter((d) => (d.totalHours ?? 0) > 0);
  if (days.some((d) => d.status === 'SUBMITTED')) return 'FOR_APPROVAL';
  if (days.some((d) => d.status === 'REJECTED')) return 'REJECTED';
  if (withHours.length > 0 && withHours.every((d) => d.status === 'APPROVED')) return 'APPROVED';
  if (withHours.length === 0) {
    // Every day in the period is a synthesized leave placeholder — the employee
    // was out the whole time, not simply missing entries.
    if (days.length > 0 && days.every((d) => d.leaveDay)) return 'ON_LEAVE';
    return 'NO_ENTRY';
  }
  return 'DRAFT';
}

const STATUS_LABEL: Record<CardStatus, { text: string; cls: string }> = {
  FOR_APPROVAL: { text: 'For Approval', cls: styles.mgrStatusForApproval },
  NO_ENTRY: { text: 'No Entry', cls: styles.mgrStatusNoEntry },
  APPROVED: { text: 'Approved', cls: styles.mgrStatusApproved },
  REJECTED: { text: 'Rejected', cls: styles.mgrStatusRejected },
  DRAFT: { text: 'Draft', cls: styles.mgrStatusDraft },
  ON_LEAVE: { text: 'On Leave', cls: styles.mgrStatusOnLeave },
};

function matchesFilter(status: CardStatus, filter: ManagerStatusFilter): boolean {
  switch (filter) {
    case 'ALL':
      return true;
    case 'FOR_APPROVAL':
      return status === 'FOR_APPROVAL';
    case 'REJECTED':
      return status === 'REJECTED';
    case 'APPROVED':
      return status === 'APPROVED';
    case 'ENABLED':
      return status === 'NO_ENTRY' || status === 'DRAFT';
    case 'ON_LEAVE':
      return status === 'ON_LEAVE';
    case 'BLOCKED':
      return false; // locked-period gating is a backend concern (flagged)
    default:
      return true;
  }
}

export default function EmployeeTimesheetsDashboard() {
  const {
    teamTimesheets,
    loadingTeam,
    managerPeriod,
    managerScope,
    managerSearch,
    managerStatusFilter,
    selectedMonth,
    selectedWeekStart,
    approvingTimesheet,
    setManagerPeriod,
    setSelectedMonth,
    setManagerScope,
    setManagerSearch,
    setManagerStatusFilter,
    openEmployeeReview,
  } = useHrmTimesheetStore();
  const { loadTeamTimesheets } = useHrmTimesheetData();
  const { bulkApproveTimesheets } = useHrmTimesheetUI();

  const [reject, setReject] = useState<{ name: string; handles: string[] } | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');

  useEffect(() => {
    void loadTeamTimesheets();
  }, [managerPeriod, selectedMonth, selectedWeekStart, managerScope, loadTeamTimesheets]);

  const prevMonth = () => setSelectedMonth(dayjs(selectedMonth).subtract(1, 'month').format('YYYY-MM-01'));
  const nextMonth = () => setSelectedMonth(dayjs(selectedMonth).add(1, 'month').format('YYYY-MM-01'));
  const atCurrentMonth = dayjs(selectedMonth).isSame(dayjs(), 'month');

  const cards = useMemo(() => {
    const search = managerSearch.trim().toLowerCase();
    return (teamTimesheets ?? [])
      .map((emp) => {
        const days = emp.weeklyData ?? [];
        return {
          emp,
          status: deriveStatus(emp),
          totalHours: days.reduce((s, d) => s + (d.totalHours ?? 0), 0),
          submittedHandles: days
            .filter((d) => d.status === 'SUBMITTED' && d.timesheetHandle)
            .map((d) => d.timesheetHandle as string),
        };
      })
      .filter((c) => matchesFilter(c.status, managerStatusFilter))
      .filter((c) => !search || c.emp.employeeName?.toLowerCase().includes(search));
  }, [teamTimesheets, managerSearch, managerStatusFilter]);

  async function approveCard(handles: string[]) {
    await bulkApproveTimesheets(handles, 'APPROVED', '');
    await loadTeamTimesheets();
  }

  async function confirmReject() {
    if (!reject || !rejectRemarks.trim()) return;
    await bulkApproveTimesheets(reject.handles, 'REJECTED', rejectRemarks.trim());
    setReject(null);
    setRejectRemarks('');
    await loadTeamTimesheets();
  }

  return (
    <div className={styles.mgrRoot}>
      <div className={styles.mgrFilters}>
        <Segmented
          size="small"
          value={managerPeriod}
          onChange={(v) => setManagerPeriod(v as 'month' | 'week')}
          options={[
            { label: 'Monthly', value: 'month' },
            { label: 'Weekly', value: 'week' },
          ]}
        />
        {managerPeriod === 'week' ? (
          <WeekNavigator />
        ) : (
          <Space>
            <Button size="small" icon={<LeftOutlined />} onClick={prevMonth} />
            <Text strong style={{ minWidth: 120, textAlign: 'center', display: 'inline-block' }}>
              {dayjs(selectedMonth).format('MMMM YYYY')}
            </Text>
            <Button size="small" icon={<RightOutlined />} onClick={nextMonth} disabled={atCurrentMonth} />
          </Space>
        )}
        <Input
          allowClear
          size="small"
          prefix={<SearchOutlined />}
          placeholder="Search by Employee"
          value={managerSearch}
          onChange={(e) => setManagerSearch(e.target.value)}
          style={{ width: 200 }}
        />
        <Select
          size="small"
          value={managerScope}
          onChange={setManagerScope}
          style={{ width: 220 }}
          options={[
            { value: 'direct', label: 'Reporting To Me' },
            // The server returns the whole subtree it lets you see, not just
            // one extra rung, so the label does not promise exactly two levels.
            { value: 'all', label: 'All reportees (2nd level and below)' },
          ]}
        />
        <div className={styles.mgrFiltersRight}>
          <Segmented
            size="small"
            value={managerStatusFilter}
            onChange={(v) => setManagerStatusFilter(v as ManagerStatusFilter)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      {managerScope === 'all' && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
          Showing everyone below you in the reporting line, as deep as you are permitted to approve.
        </Text>
      )}

      {loadingTeam ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : cards.length === 0 ? (
        <Empty description="No employees for this filter" />
      ) : (
        <div className={styles.mgrCardGrid}>
          {cards.map(({ emp, status, totalHours, submittedHandles }) => {
            const label = STATUS_LABEL[status];
            const actionable = status === 'FOR_APPROVAL' && submittedHandles.length > 0;
            return (
              <div key={emp.employeeId} className={styles.mgrCard}>
                <div>
                  <div className={styles.mgrCardName}>{emp.employeeName}</div>
                  {emp.department && <div className={styles.mgrCardDept}>{emp.department}</div>}
                </div>
                <div className={styles.mgrCardRow}>
                  <span className={label.cls}>{label.text}</span>
                  <span className={styles.mgrCardHours}>{decimalToHHMM(totalHours)}</span>
                </div>
                {status !== 'NO_ENTRY' && status !== 'ON_LEAVE' && (
                  <span
                    className={styles.mgrViewLink}
                    onClick={() =>
                      openEmployeeReview({
                        employeeId: emp.employeeId,
                        employeeName: emp.employeeName,
                        department: emp.department,
                      })
                    }
                  >
                    <EyeOutlined /> View Time
                  </span>
                )}
                {actionable && (
                  <div className={styles.mgrCardActions}>
                    <ApprovalGate>
                      <Button
                        size="small"
                        type="primary"
                        icon={<CheckOutlined />}
                        loading={approvingTimesheet}
                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                        onClick={() => approveCard(submittedHandles)}
                      >
                        Approve
                      </Button>
                    </ApprovalGate>
                    <ApprovalGate>
                      <Button
                        size="small"
                        danger
                        icon={<CloseOutlined />}
                        loading={approvingTimesheet}
                        onClick={() => {
                          setReject({ name: emp.employeeName, handles: submittedHandles });
                          setRejectRemarks('');
                        }}
                      >
                        Reject
                      </Button>
                    </ApprovalGate>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        title={`Reject timesheet — ${reject?.name ?? ''}`}
        open={!!reject}
        onCancel={() => setReject(null)}
        onOk={confirmReject}
        okText="Reject"
        okButtonProps={{ danger: true, disabled: !rejectRemarks.trim(), loading: approvingTimesheet }}
      >
        <Text type="secondary">Rejection notes are sent back to the employee (required).</Text>
        <Input.TextArea
          rows={3}
          placeholder="Reason for rejection..."
          value={rejectRemarks}
          onChange={(e) => setRejectRemarks(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </Modal>
    </div>
  );
}
