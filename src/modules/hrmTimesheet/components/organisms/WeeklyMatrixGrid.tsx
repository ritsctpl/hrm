'use client';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Input, InputNumber, Select, Space, Typography } from 'antd';
import {
  ArrowLeftOutlined,
  DownOutlined,
  RightOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import { useHrmTimesheetData } from '../../hooks/useHrmTimesheetData';
import { useHrmTimesheetUI } from '../../hooks/useHrmTimesheetUI';
import {
  weekDates,
  isToday,
  isInCurrentMonth,
  isFutureDate,
  weekOfMonthIndex,
  buildMonthMatrix,
} from '../../utils/timesheetHelpers';
import { HOURS_STEP, LINE_TYPE_LABELS } from '../../utils/timesheetConstants';
import Can from '../../../hrmAccess/components/Can';
import type { TimesheetHeader, TimesheetLine } from '../../types/domain.types';
import type { MatrixLineInput } from '../../types/ui.types';
import styles from '../../styles/TimesheetCalendar.module.css';

const { Text } = Typography;

/** Stable identity for a matrix row across the 7 days. */
function rowKeyOf(l: Pick<TimesheetLine, 'lineType' | 'projectHandle' | 'projectCode' | 'allocationHandle' | 'categoryId'>): string {
  if (l.lineType === 'PROJECT' || l.lineType === 'ALLOCATED')
    return `PROJECT::${l.projectHandle ?? l.projectCode ?? '?'}::${l.allocationHandle ?? ''}`;
  if (l.lineType === 'UNPLANNED') return `UNPLANNED::${l.categoryId ?? '?'}`;
  return l.lineType;
}

interface MatrixRow {
  key: string;
  lineType: TimesheetLine['lineType'];
  projectHandle?: string;
  projectCode?: string;
  projectName?: string;
  allocationHandle?: string;
  taskId?: string;
  taskName?: string;
  categoryId?: string;
  categoryLabel?: string;
  /** Label shown in the left column for this (sub-)row. */
  subLabel: string;
}

export default function WeeklyMatrixGrid() {
  const {
    selectedDate,
    selectedMonth,
    monthlyTimesheets,
    assignedAllocations,
    unplannedCategories,
    savingTimesheet,
    submittingWeek,
    backToMonthView,
    openWeekForDate,
  } = useHrmTimesheetStore();
  const { loadMonthlyTimesheets, loadAssignedAllocations } = useHrmTimesheetData();
  const { saveMatrixDays, submitMatrixDays } = useHrmTimesheetUI();

  const dates = useMemo(() => weekDates(selectedDate), [selectedDate]);

  const byDate = useMemo(() => {
    const m = new Map<string, TimesheetHeader>();
    monthlyTimesheets.forEach((t) => m.set(t.date, t));
    return m;
  }, [monthlyTimesheets]);

  // Local editable draft: date -> lines (deep-copied from the month data).
  const [draft, setDraft] = useState<Record<string, TimesheetLine[]>>({});
  const [notes, setNotes] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    void loadMonthlyTimesheets();
  }, [selectedMonth, loadMonthlyTimesheets]);

  useEffect(() => {
    void loadAssignedAllocations();
  }, [loadAssignedAllocations]);

  // (Re)seed the draft whenever the week or underlying data changes.
  useEffect(() => {
    const seed: Record<string, TimesheetLine[]> = {};
    dates.forEach((d) => {
      const ts = byDate.get(d);
      seed[d] = (ts?.lines ?? []).map((l) => ({ ...l }));
    });
    setDraft(seed);
    const firstWithNote = dates.map((d) => byDate.get(d)).find((t) => t?.notes);
    setNotes(firstWithNote?.notes ?? '');
  }, [dates, byDate]);

  function dayEditable(date: string): boolean {
    if (!isInCurrentMonth(date) || isFutureDate(date)) return false;
    const ts = byDate.get(date);
    return !(ts && (ts.status === 'SUBMITTED' || ts.status === 'APPROVED'));
  }

  // Allocation lookup so saved lines (which only carry allocationHandle) can
  // recover their task/project labels from hrm-project.
  const allocByHandle = useMemo(() => {
    const m = new Map<string, typeof assignedAllocations[number]>();
    assignedAllocations.forEach((a) => m.set(a.allocationHandle, a));
    return m;
  }, [assignedAllocations]);

  // Allocations overlapping the displayed week — the "assigned" rows.
  const weekAllocations = useMemo(() => {
    const weekStart = dates[0];
    const weekEnd = dates[6];
    return assignedAllocations.filter((a) => a.startDate <= weekEnd && a.endDate >= weekStart);
  }, [assignedAllocations, dates]);

  // Build the union of rows: assigned allocations first (so they show even
  // with zero hours), then any extra lines already saved (unplanned, holiday,
  // or projects no longer in the active allocation set).
  const rows = useMemo<MatrixRow[]>(() => {
    const map = new Map<string, MatrixRow>();
    weekAllocations.forEach((a) => {
      const key = `PROJECT::${a.projectHandle ?? a.projectCode ?? '?'}::${a.allocationHandle ?? ''}`;
      map.set(key, {
        key,
        lineType: 'PROJECT',
        projectHandle: a.projectHandle,
        projectCode: a.projectCode,
        projectName: a.projectName,
        allocationHandle: a.allocationHandle,
        taskId: a.taskId,
        taskName: a.taskName,
        subLabel: a.taskName || a.projectName || a.projectCode || 'Project',
      });
    });
    dates.forEach((d) => {
      (draft[d] ?? []).forEach((l) => {
        const key = rowKeyOf(l);
        if (map.has(key)) return;
        const alloc = l.allocationHandle ? allocByHandle.get(l.allocationHandle) : undefined;
        let subLabel: string;
        if (l.lineType === 'PROJECT' || l.lineType === 'ALLOCATED') {
          subLabel = l.taskName || alloc?.taskName || l.projectName || l.projectCode || 'Project';
        } else if (l.lineType === 'UNPLANNED') {
          subLabel = l.categoryLabel || 'Unplanned';
        } else {
          subLabel = LINE_TYPE_LABELS[l.lineType] ?? l.lineType;
        }
        map.set(key, {
          key,
          lineType: l.lineType,
          projectHandle: l.projectHandle,
          projectCode: l.projectCode,
          projectName: l.projectName,
          allocationHandle: l.allocationHandle,
          taskId: l.taskId ?? alloc?.taskId,
          taskName: l.taskName ?? alloc?.taskName,
          categoryId: l.categoryId,
          categoryLabel: l.categoryLabel,
          subLabel,
        });
      });
    });
    return Array.from(map.values());
  }, [dates, draft, weekAllocations, allocByHandle]);

  // Group PROJECT rows by project for the expandable left column.
  const projectGroups = useMemo(() => {
    const groups = new Map<string, { code?: string; name?: string; rows: MatrixRow[] }>();
    rows
      .filter((r) => r.lineType === 'PROJECT' || r.lineType === 'ALLOCATED')
      .forEach((r) => {
        const pk = r.projectHandle ?? r.projectCode ?? '?';
        if (!groups.has(pk)) groups.set(pk, { code: r.projectCode, name: r.projectName, rows: [] });
        groups.get(pk)!.rows.push(r);
      });
    return groups;
  }, [rows]);

  const otherRows = useMemo(
    () => rows.filter((r) => r.lineType !== 'PROJECT' && r.lineType !== 'ALLOCATED'),
    [rows]
  );

  function cellHours(rowKey: string, date: string): number {
    const line = (draft[date] ?? []).find((l) => rowKeyOf(l) === rowKey);
    return line?.hours ?? 0;
  }

  function setCell(row: MatrixRow, date: string, value: number) {
    setDraft((prev) => {
      const lines = [...(prev[date] ?? [])];
      const idx = lines.findIndex((l) => rowKeyOf(l) === row.key);
      if (idx >= 0) {
        lines[idx] = { ...lines[idx], hours: value };
      } else {
        lines.push({
          lineId: `new-${row.key}-${date}`,
          lineType: row.lineType,
          projectHandle: row.projectHandle,
          projectCode: row.projectCode,
          projectName: row.projectName,
          allocationHandle: row.allocationHandle,
          taskId: row.taskId,
          taskName: row.taskName,
          categoryId: row.categoryId,
          categoryLabel: row.categoryLabel,
          hours: value,
          overrun: false,
        });
      }
      return { ...prev, [date]: lines };
    });
  }

  function rowWeekTotal(rowKey: string): number {
    return dates.reduce((s, d) => s + cellHours(rowKey, d), 0);
  }

  const dayTotals = useMemo(
    () => dates.map((d) => (draft[d] ?? []).reduce((s, l) => s + (l.hours ?? 0), 0)),
    [dates, draft]
  );
  const grandTotal = dayTotals.reduce((s, h) => s + h, 0);

  function addUnplannedRow(categoryId: string) {
    const cat = unplannedCategories.find((c) => c.handle === categoryId);
    // Seed a zero-hour line on the first editable day so the row appears.
    const firstEditable = dates.find(dayEditable) ?? dates[0];
    setDraft((prev) => {
      const lines = [...(prev[firstEditable] ?? [])];
      const key = `UNPLANNED::${categoryId}`;
      if (!lines.some((l) => rowKeyOf(l) === key)) {
        lines.push({
          lineId: `new-${key}`,
          lineType: 'UNPLANNED',
          categoryId,
          categoryLabel: cat?.label,
          hours: 0,
          overrun: false,
        });
      }
      return { ...prev, [firstEditable]: lines };
    });
  }

  function toMatrixLines(lines: TimesheetLine[]): MatrixLineInput[] {
    return lines
      .filter((l) => (l.hours ?? 0) > 0)
      .map((l) => ({
        lineType: l.lineType,
        projectHandle: l.projectHandle,
        allocationHandle: l.allocationHandle,
        taskId: l.taskId,
        categoryId: l.categoryId,
        hours: l.hours,
        reason: l.reason,
        notes: l.notes,
      }));
  }

  function buildDaysPayload() {
    return dates
      .filter(dayEditable)
      .map((date) => ({ date, lines: toMatrixLines(draft[date] ?? []), notes }));
  }

  async function handleSave() {
    await saveMatrixDays(buildDaysPayload());
  }

  async function handleSaveAndSubmit() {
    await saveMatrixDays(buildDaysPayload());
    // Re-read fresh handles after the reload, then submit the editable days.
    const fresh = useHrmTimesheetStore.getState().monthlyTimesheets;
    const handles = dates
      .map((d) => fresh.find((t) => t.date === d))
      .filter((t): t is TimesheetHeader => !!t?.handle)
      .filter((t) => t.status === 'DRAFT' || t.status === 'REOPENED' || t.status === 'REJECTED')
      .map((t) => t.handle);
    await submitMatrixDays(handles);
  }

  // Week dropdown options for the current month.
  const weekOptions = useMemo(() => {
    const weeks = buildMonthMatrix(selectedMonth);
    return weeks.map((w) => {
      const sun = w[0].date;
      const sat = w[6].date;
      return {
        value: sun,
        label: `Week ${weekOfMonthIndex(sun)}: ${dayjs(sun).format('MMM DD')} – ${dayjs(sat).format('MMM DD')}`,
      };
    });
  }, [selectedMonth]);

  const weekStartSun = dates[0];
  const weekEndSat = dates[6];
  const anyEditable = dates.some(dayEditable);

  const renderCell = (row: MatrixRow, date: string) => {
    const editable = dayEditable(date);
    const val = cellHours(row.key, date);
    if (!editable) {
      return val > 0 ? `${val.toFixed(1)}` : <span className={styles.matrixNoEntry}>—</span>;
    }
    return (
      <span className={styles.matrixCellInput}>
        <InputNumber
          size="small"
          min={0}
          max={24}
          step={HOURS_STEP}
          value={val || undefined}
          placeholder="0"
          onChange={(v) => setCell(row, date, v ?? 0)}
        />
      </span>
    );
  };

  return (
    <div className={styles.matrixRoot}>
      <div className={styles.matrixHeader}>
        <Space>
          <Button size="small" icon={<ArrowLeftOutlined />} onClick={backToMonthView}>
            Calendar
          </Button>
          <span className={styles.matrixWeekLabel}>{dayjs(selectedMonth).format('MMMM YYYY')}</span>
        </Space>
        <Space>
          <Select
            size="small"
            style={{ width: 240 }}
            value={weekStartSun}
            options={weekOptions}
            onChange={(v) => openWeekForDate(v)}
          />
        </Space>
        <span className={styles.matrixWeekLabel}>
          Week {weekOfMonthIndex(weekStartSun)}: {dayjs(weekStartSun).format('MMM DD')} –{' '}
          {dayjs(weekEndSat).format('MMM DD, YYYY')}
        </span>
      </div>

      {!isInCurrentMonth(selectedDate) && (
        <Alert
          type="warning"
          showIcon
          message="This week is outside the current month — entries are read-only."
          style={{ marginBottom: 12 }}
        />
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className={styles.matrixTable}>
          <thead>
            <tr>
              <th className="projCol">Project / Task</th>
              {dates.map((d) => (
                <th key={d}>
                  <div className={`${styles.matrixDayHead} ${isToday(d) ? styles.matrixDayHeadToday : ''}`}>
                    {dayjs(d).format('ddd')}
                  </div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>{dayjs(d).format('DD')}</div>
                </th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(projectGroups.entries()).map(([pk, group]) => {
              const isCollapsed = collapsed.has(pk);
              const groupTotalPerDay = dates.map((d) =>
                group.rows.reduce((s, r) => s + cellHours(r.key, d), 0)
              );
              const groupWeekTotal = group.rows.reduce((s, r) => s + rowWeekTotal(r.key), 0);
              return (
                <Fragment key={pk}>
                  <tr
                    className={styles.matrixProjectRow}
                    onClick={() =>
                      setCollapsed((prev) => {
                        const next = new Set(prev);
                        if (next.has(pk)) next.delete(pk);
                        else next.add(pk);
                        return next;
                      })
                    }
                  >
                    <td className="projCol">
                      {isCollapsed ? <RightOutlined /> : <DownOutlined />}{' '}
                      {group.code ? `${group.code} — ${group.name ?? ''}` : group.name ?? 'Project'}
                    </td>
                    {groupTotalPerDay.map((h, i) => (
                      <td key={dates[i]}>{h > 0 ? h.toFixed(1) : ''}</td>
                    ))}
                    <td className={styles.matrixTotalCol}>{groupWeekTotal.toFixed(1)}</td>
                  </tr>
                  {!isCollapsed &&
                    group.rows.map((row) => (
                      <tr key={row.key} className={styles.matrixSubRow}>
                        <td className="projCol">{row.subLabel}</td>
                        {dates.map((d) => (
                          <td key={d}>{renderCell(row, d)}</td>
                        ))}
                        <td className={styles.matrixTotalCol}>{rowWeekTotal(row.key).toFixed(1)}</td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}

            {otherRows.map((row) => (
              <tr key={row.key} className={styles.matrixSubRow}>
                <td className="projCol">
                  {LINE_TYPE_LABELS[row.lineType] ?? row.lineType}
                  {row.lineType === 'UNPLANNED' ? `: ${row.subLabel}` : ''}
                </td>
                {dates.map((d) => (
                  <td key={d}>{renderCell(row, d)}</td>
                ))}
                <td className={styles.matrixTotalCol}>{rowWeekTotal(row.key).toFixed(1)}</td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td className="projCol" colSpan={9}>
                  <Text type="secondary">
                    No approved project allocations for this week. Add unplanned work below, or
                    ask your manager to assign you in the Projects module.
                  </Text>
                </td>
              </tr>
            )}

            <tr>
              <td className="projCol">
                <Text strong>Daily Total</Text>
              </td>
              {dayTotals.map((h, i) => (
                <td key={dates[i]} className={styles.matrixTotalCol}>
                  {h.toFixed(1)}
                </td>
              ))}
              <td className={styles.matrixGrandTotal}>{grandTotal.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.matrixFooter}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Notes
          </Text>
          <Input.TextArea
            rows={2}
            placeholder="Enter note for this week..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!anyEditable}
            style={{ marginTop: 4 }}
          />
          {anyEditable && (
            <Can I="add">
              <Select
                size="small"
                placeholder="+ Add unplanned work"
                style={{ width: 220, marginTop: 8 }}
                value={null}
                options={unplannedCategories.map((c) => ({ label: c.label, value: c.handle }))}
                onSelect={(v) => addUnplannedRow(v as string)}
              />
            </Can>
          )}
        </div>
        <div className={styles.matrixActions}>
          <Can I="edit">
            <Button
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={savingTimesheet}
              disabled={!anyEditable}
            >
              Save
            </Button>
          </Can>
          <Can I="edit">
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSaveAndSubmit}
              loading={savingTimesheet || submittingWeek}
              disabled={!anyEditable}
              style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
            >
              Save &amp; Submit
            </Button>
          </Can>
        </div>
      </div>
    </div>
  );
}
