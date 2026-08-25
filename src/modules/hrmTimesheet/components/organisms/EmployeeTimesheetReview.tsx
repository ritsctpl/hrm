'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, Segmented, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  LeftOutlined,
  RedoOutlined,
  RightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import { useHrmTimesheetData } from '../../hooks/useHrmTimesheetData';
import { useHrmTimesheetUI } from '../../hooks/useHrmTimesheetUI';
import {
  buildMonthMatrix,
  weekDates,
  decimalToHHMM,
  isToday,
  weekOfMonthIndex,
  shiftWeekStart,
  weekIntersectsMonth,
} from '../../utils/timesheetHelpers';
import { LINE_TYPE_LABELS } from '../../utils/timesheetConstants';
import ApprovalGate from '../atoms/ApprovalGate';
import type { TimesheetHeader, TimesheetLine } from '../../types/domain.types';
import styles from '../../styles/TimesheetCalendar.module.css';

const { Text } = Typography;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function rowKeyOf(l: TimesheetLine): string {
  if (l.lineType === 'PROJECT' || l.lineType === 'ALLOCATED')
    return `PROJECT::${l.projectHandle ?? l.projectCode ?? '?'}::${l.allocationHandle ?? ''}`;
  if (l.lineType === 'UNPLANNED') return `UNPLANNED::${l.categoryId ?? '?'}`;
  return l.lineType;
}

function rowLabel(l: TimesheetLine): string {
  if (l.lineType === 'PROJECT' || l.lineType === 'ALLOCATED')
    return l.taskName || l.projectName || l.projectCode || 'Project';
  if (l.lineType === 'UNPLANNED') return l.categoryLabel || 'Unplanned';
  return LINE_TYPE_LABELS[l.lineType] ?? l.lineType;
}

export default function EmployeeTimesheetReview() {
  const {
    targetEmployee,
    targetEmployeeTimesheets,
    loadingTargetEmployee,
    selectedMonth,
    selectedDate,
    approvingTimesheet,
    backToDashboard,
    setSelectedDate,
  } = useHrmTimesheetStore();
  const { loadTargetEmployeeMonth, loadTeamTimesheets } = useHrmTimesheetData();
  const { approveTimesheet, bulkApproveTimesheets, reopenTimesheet } = useHrmTimesheetUI();

  // Reject modal — used for both single-day and global reject (handles list).
  const [reject, setReject] = useState<{ scope: string; handles: string[] } | null>(null);
  const [remarks, setRemarks] = useState('');
  // Reopen modal — undoes an approval (or a still-lingering rejection) for one day, so the
  // employee can re-enter it. A reason is required (hrm-service TS_XXX @NotBlank) and is written
  // to the approval audit trail.
  const [reopen, setReopen] = useState<{ scope: string; handle: string } | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  // Approve modal. The note is optional for a direct manager, but hrm-service requires one
  // when the approver is outside the employee's direct reporting line (TS_016), and the UI
  // previously sent an empty string always — so a skip-level approval could never succeed.
  const [approve, setApprove] = useState<{ scope: string; handles: string[] } | null>(null);
  const [approveNote, setApproveNote] = useState('');
  // Drill-down view toggle: monthly calendar summary vs weekly matrix verification.
  const [layout, setLayout] = useState<'month' | 'week'>('month');

  useEffect(() => {
    void loadTargetEmployeeMonth();
  }, [loadTargetEmployeeMonth]);

  const byDate = useMemo(() => {
    const m = new Map<string, TimesheetHeader>();
    targetEmployeeTimesheets.forEach((t) => m.set(t.date, t));
    return m;
  }, [targetEmployeeTimesheets]);

  const weeks = useMemo(() => buildMonthMatrix(selectedMonth), [selectedMonth]);
  const monthTotal = useMemo(
    () => targetEmployeeTimesheets.reduce((s, t) => s + (t.totalHours ?? 0), 0),
    [targetEmployeeTimesheets]
  );
  const submittedHandles = useMemo(
    () => targetEmployeeTimesheets.filter((t) => t.status === 'SUBMITTED').map((t) => t.handle),
    [targetEmployeeTimesheets]
  );

  const dates = useMemo(() => weekDates(selectedDate), [selectedDate]);

  // Weekly pivot rows (read-only) across the selected week's days.
  const weekRows = useMemo(() => {
    const map = new Map<string, { key: string; label: string }>();
    dates.forEach((d) => {
      (byDate.get(d)?.lines ?? []).forEach((l) => {
        const key = rowKeyOf(l);
        if (!map.has(key)) map.set(key, { key, label: rowLabel(l) });
      });
    });
    return Array.from(map.values());
  }, [dates, byDate]);

  function cellHours(rowKey: string, date: string): number {
    return (byDate.get(date)?.lines ?? [])
      .filter((l) => rowKeyOf(l) === rowKey)
      .reduce((s, l) => s + (l.hours ?? 0), 0);
  }

  async function afterAction() {
    await loadTargetEmployeeMonth();
    await loadTeamTimesheets();
  }

  function askApprove(scope: string, handles: string[]) {
    setApprove({ scope, handles });
    setApproveNote('');
  }

  async function confirmApprove() {
    if (!approve) return;
    const note = approveNote.trim();
    if (approve.handles.length === 1) {
      await approveTimesheet(approve.handles[0], 'APPROVED', note);
    } else {
      await bulkApproveTimesheets(approve.handles, 'APPROVED', note);
    }
    setApprove(null);
    setApproveNote('');
    await afterAction();
  }

  async function confirmReject() {
    if (!reject || !remarks.trim()) return;
    if (reject.handles.length === 1) {
      await approveTimesheet(reject.handles[0], 'REJECTED', remarks.trim());
    } else {
      await bulkApproveTimesheets(reject.handles, 'REJECTED', remarks.trim());
    }
    setReject(null);
    setRemarks('');
    await afterAction();
  }

  function askReopen(scope: string, handle: string) {
    setReopen({ scope, handle });
    setReopenReason('');
  }

  async function confirmReopen() {
    if (!reopen || !reopenReason.trim()) return;
    await reopenTimesheet(reopen.handle, reopenReason.trim());
    setReopen(null);
    setReopenReason('');
    await afterAction();
  }

  const weekNote = dates.map((d) => byDate.get(d)).find((t) => t?.notes)?.notes;

  // Week navigation is bounded by the month that is actually loaded: byDate comes from
  // loadTargetEmployeeMonth, which is scoped to selectedMonth, so stepping onto a week with
  // no overlap would render seven empty columns and read as "nothing was logged".
  const canStepWeek = (delta: number) =>
    weekIntersectsMonth(shiftWeekStart(selectedDate, delta), selectedMonth);
  const stepWeek = (delta: number) => setSelectedDate(shiftWeekStart(selectedDate, delta));
  const todayStr = dayjs().format('YYYY-MM-DD');
  const showThisWeek =
    weekIntersectsMonth(todayStr, selectedMonth) && !dates.includes(todayStr);

  return (
    <div className={styles.reviewRoot}>
      <div className={styles.reviewHeader}>
        <Space>
          <Button size="small" icon={<ArrowLeftOutlined />} onClick={backToDashboard}>
            Employees
          </Button>
          <div>
            <div className={styles.reviewEmpName}>{targetEmployee?.employeeName}</div>
            {targetEmployee?.department && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {targetEmployee.department}
              </Text>
            )}
          </div>
        </Space>
        <Segmented
          size="small"
          value={layout}
          onChange={(v) => setLayout(v as 'month' | 'week')}
          options={[
            { label: 'Monthly', value: 'month' },
            { label: 'Weekly', value: 'week' },
          ]}
        />
        <Space>
          <Text className={styles.calTotal}>
            Total Hours<span className={styles.calTotalValue}>{decimalToHHMM(monthTotal)}</span>
          </Text>
          <ApprovalGate>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              disabled={submittedHandles.length === 0}
              loading={approvingTimesheet}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => askApprove('all submitted days', submittedHandles)}
            >
              Approve All
            </Button>
          </ApprovalGate>
          <ApprovalGate>
            <Button
              danger
              icon={<CloseOutlined />}
              disabled={submittedHandles.length === 0}
              loading={approvingTimesheet}
              onClick={() => {
                setReject({ scope: 'all submitted days', handles: submittedHandles });
                setRemarks('');
              }}
            >
              Reject All
            </Button>
          </ApprovalGate>
        </Space>
      </div>

      {loadingTargetEmployee ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : (
        <>
          {layout === 'month' && (
          <>
          {/* Layout 1: read-only month calendar drill-down */}
          <div style={{ marginBottom: 8 }}>
            <Text strong>{dayjs(selectedMonth).format('MMMM YYYY')}</Text>
          </div>
          <div className={styles.weekdayRow}>
            {WEEKDAYS.map((d) => (
              <div key={d} className={styles.weekdayCell}>
                {d}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className={styles.calWeek}>
              {week.map((cell) => {
                const ts = byDate.get(cell.date);
                const hours = ts?.totalHours ?? 0;
                const inWeek = dates.includes(cell.date);
                const cellClass = [
                  styles.calCell,
                  !cell.inMonth ? styles.calCellOutMonth : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <div
                    key={cell.date}
                    className={cellClass}
                    style={inWeek ? { borderColor: '#4096ff' } : undefined}
                    onClick={() => {
                      if (cell.inMonth) {
                        setSelectedDate(cell.date);
                        setLayout('week');
                      }
                    }}
                  >
                    <div className={styles.calCellTop}>
                      <span className={`${styles.calDateNum} ${isToday(cell.date) ? styles.calDateToday : ''}`}>
                        {dayjs(cell.date).format('D')}
                      </span>
                      {ts?.holiday && <Tag color="blue" style={{ margin: 0 }}>Hol</Tag>}
                    </div>
                    {cell.inMonth && (
                      <>
                        <div className={styles.calHours} style={{ color: hours > 0 ? '#1677ff' : undefined }}>
                          {decimalToHHMM(hours)}
                        </div>
                        {ts?.status === 'SUBMITTED' ? (
                          <span className={styles.reviewForApproval}>For Approval</span>
                        ) : hours === 0 && !ts?.holiday && !ts?.leaveDay ? (
                          <span className={styles.calNoEntry}>No Entry</span>
                        ) : (
                          ts?.status && <span style={{ fontSize: 10, color: '#8c8c8c' }}>{ts.status}</span>
                        )}
                        {ts?.status === 'SUBMITTED' && ts?.handle && (
                          <div
                            className={styles.dayActionIcons}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ApprovalGate>
                              <Tooltip title="Approve this day">
                                <CheckCircleOutlined
                                  className={styles.dayApprove}
                                  onClick={() =>
                                    askApprove(dayjs(cell.date).format('DD MMM'), [ts.handle])
                                  }
                                />
                              </Tooltip>
                            </ApprovalGate>
                            <ApprovalGate>
                              <Tooltip title="Reject this day">
                                <CloseCircleOutlined
                                  className={styles.dayReject}
                                  onClick={() => {
                                    setReject({ scope: dayjs(cell.date).format('DD MMM'), handles: [ts.handle] });
                                    setRemarks('');
                                  }}
                                />
                              </Tooltip>
                            </ApprovalGate>
                          </div>
                        )}
                        {(ts?.status === 'APPROVED' || ts?.status === 'REJECTED') && ts?.handle && (
                          <div
                            className={styles.dayActionIcons}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ApprovalGate>
                              <Tooltip title="Reopen this day — undo the decision and let the employee re-enter it">
                                <RedoOutlined
                                  className={styles.dayReject}
                                  onClick={() => askReopen(dayjs(cell.date).format('DD MMM'), ts.handle)}
                                />
                              </Tooltip>
                            </ApprovalGate>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          </>
          )}

          {layout === 'week' && (
          <>
          {/* Layout 2: weekly matrix verification with per-day actions */}
          <div
            style={{
              margin: '16px 0 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <Button
              size="small"
              icon={<LeftOutlined />}
              disabled={!canStepWeek(-1)}
              onClick={() => stepWeek(-1)}
              title={canStepWeek(-1) ? 'Previous week' : 'Start of the selected month'}
            />
            <Text strong>
              Week {weekOfMonthIndex(dates[0])}: {dayjs(dates[0]).format('MMM DD')} –{' '}
              {dayjs(dates[6]).format('MMM DD, YYYY')}
            </Text>
            <Button
              size="small"
              icon={<RightOutlined />}
              disabled={!canStepWeek(1)}
              onClick={() => stepWeek(1)}
              title={canStepWeek(1) ? 'Next week' : 'End of the selected month'}
            />
            {showThisWeek && (
              <Button size="small" type="link" onClick={() => setSelectedDate(todayStr)}>
                This week
              </Button>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.matrixTable}>
              <thead>
                <tr>
                  <th className="projCol">Project / Task</th>
                  {dates.map((d) => {
                    const ts = byDate.get(d);
                    const submitted = ts?.status === 'SUBMITTED';
                    return (
                      <th key={d}>
                        <div className={`${styles.matrixDayHead} ${isToday(d) ? styles.matrixDayHeadToday : ''}`}>
                          {dayjs(d).format('ddd')}
                        </div>
                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>{dayjs(d).format('DD')}</div>
                        {submitted && ts?.handle && (
                          <div className={styles.dayActionIcons}>
                            <ApprovalGate>
                              <Tooltip title="Approve this day">
                                <CheckCircleOutlined
                                  className={styles.dayApprove}
                                  onClick={() => askApprove(dayjs(d).format('DD MMM'), [ts.handle])}
                                />
                              </Tooltip>
                            </ApprovalGate>
                            <ApprovalGate>
                              <Tooltip title="Reject this day">
                                <CloseCircleOutlined
                                  className={styles.dayReject}
                                  onClick={() => {
                                    setReject({ scope: dayjs(d).format('DD MMM'), handles: [ts.handle] });
                                    setRemarks('');
                                  }}
                                />
                              </Tooltip>
                            </ApprovalGate>
                          </div>
                        )}
                        {(ts?.status === 'APPROVED' || ts?.status === 'REJECTED') && ts?.handle && (
                          <div className={styles.dayActionIcons}>
                            <ApprovalGate>
                              <Tooltip title="Reopen this day — undo the decision and let the employee re-enter it">
                                <RedoOutlined
                                  className={styles.dayReject}
                                  onClick={() => askReopen(dayjs(d).format('DD MMM'), ts.handle)}
                                />
                              </Tooltip>
                            </ApprovalGate>
                          </div>
                        )}
                      </th>
                    );
                  })}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {weekRows.map((row) => (
                  <tr key={row.key} className={styles.matrixSubRow}>
                    <td className="projCol">{row.label}</td>
                    {dates.map((d) => {
                      const h = cellHours(row.key, d);
                      return <td key={d}>{h > 0 ? h.toFixed(1) : <span className={styles.matrixNoEntry}>—</span>}</td>;
                    })}
                    <td className={styles.matrixTotalCol}>
                      {dates.reduce((s, d) => s + cellHours(row.key, d), 0).toFixed(1)}
                    </td>
                  </tr>
                ))}
                {weekRows.length === 0 && (
                  <tr>
                    <td className="projCol" colSpan={9}>
                      <Text type="secondary">No entries logged for this week.</Text>
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="projCol">
                    <Text strong>Daily Total</Text>
                  </td>
                  {dates.map((d) => (
                    <td key={d} className={styles.matrixTotalCol}>
                      {(byDate.get(d)?.totalHours ?? 0).toFixed(1)}
                    </td>
                  ))}
                  <td className={styles.matrixGrandTotal}>
                    {dates.reduce((s, d) => s + (byDate.get(d)?.totalHours ?? 0), 0).toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {weekNote && (
            <div className={styles.weeklyNoteBox}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Weekly Note:
              </Text>
              <div>{weekNote}</div>
            </div>
          )}
          </>
          )}
        </>
      )}

      <Modal
        title={`Approve — ${approve?.scope ?? ''}`}
        open={!!approve}
        onCancel={() => setApprove(null)}
        onOk={confirmApprove}
        okText="Approve"
        okButtonProps={{ loading: approvingTimesheet }}
      >
        <Text type="secondary">
          Add a note if you want one on the approval record. A note is required when you are
          approving for someone outside your own reporting line.
        </Text>
        <Input.TextArea
          rows={3}
          placeholder="Approval note (optional)"
          value={approveNote}
          onChange={(e) => setApproveNote(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </Modal>

      <Modal
        title={`Reject — ${reject?.scope ?? ''}`}
        open={!!reject}
        onCancel={() => setReject(null)}
        onOk={confirmReject}
        okText="Reject"
        okButtonProps={{ danger: true, disabled: !remarks.trim(), loading: approvingTimesheet }}
      >
        <Text type="secondary">Rejection notes are sent back to the employee (required).</Text>
        <Input.TextArea
          rows={3}
          placeholder="Reason for rejection..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </Modal>

      <Modal
        title={`Reopen — ${reopen?.scope ?? ''}`}
        open={!!reopen}
        onCancel={() => setReopen(null)}
        onOk={confirmReopen}
        okText="Reopen"
        okButtonProps={{ disabled: !reopenReason.trim(), loading: approvingTimesheet }}
      >
        <Text type="secondary">
          Undoes the approval or rejection for this day and clears it from both calendars — the
          employee re-enters it from scratch. A reason is required and kept on the audit trail.
        </Text>
        <Input.TextArea
          rows={3}
          placeholder="Reason for reopening..."
          value={reopenReason}
          onChange={(e) => setReopenReason(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </Modal>
    </div>
  );
}
