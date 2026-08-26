'use client';

import React, { useMemo } from 'react';
import { Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import WfoWfhBar from '../molecules/WfoWfhBar';
import AttendanceQueryBar from '../molecules/AttendanceQueryBar';
import { useCan } from '@/modules/hrmAccess/hooks/useCan';
import { useHrmWorkforceData } from '../../hooks/useHrmWorkforceData';
import { isoDay, useHrmWorkforceStore } from '../../stores/hrmWorkforceStore';
import type { AttendanceDaily } from '../../types/domain.types';
import type { AttendanceQuery } from '../../types/ui.types';
import { fmtMinutes } from '../../utils/workforceFormat';
import { MODULE_CODE, OBJ } from '../../utils/workforceConstants';
import styles from '../../styles/Workforce.module.css';

const ISO = 'YYYY-MM-DD';

/**
 * The two flags, read tolerantly.
 *
 * The Mongo model declares `private boolean isHoliday`, so Lombok's accessor is `isHoliday()` and
 * Jackson puts **`holiday`** on the wire (likewise `leaveDay`) — confirmed against a live response.
 * The `is`-prefixed spellings are still read as a fallback, because the alternative to two lines
 * here is a holiday that silently renders as an ordinary absent day if a serializer setting ever
 * changes, and a wrongly-plain day is exactly the row somebody would chase.
 */
const isHolidayRow = (row: AttendanceDaily): boolean => row.holiday ?? row.isHoliday ?? false;
const isLeaveRow = (row: AttendanceDaily): boolean => row.leaveDay ?? row.isLeaveDay ?? false;

/** `HH:mm` for an ISO instant, or an em dash — a day with no first-in is a real row. */
const clock = (iso: string | null): string => {
  if (!iso) return '—';
  const d = dayjs(iso);
  return d.isValid() ? d.format('HH:mm') : '—';
};

/**
 * The employees present in the rows already loaded, for the query bar's filter.
 *
 * There is no employee-directory call on this module, and adding one to populate a filter would
 * fetch the whole organisation to narrow a window. Every employee with a derived day in the window
 * is in `rows` by construction, so the filter can narrow what is on screen — it just cannot reach
 * for somebody who has no attendance in it, which is a filter that would return nothing anyway.
 * The selected id is kept in the list even when the rows no longer contain it, so a filter never
 * silently erases itself.
 */
function employeeOptions(
  rows: AttendanceDaily[],
  selected?: string,
): Array<{ value: string; label: string }> {
  const byId = new Map<string, string>();
  (rows ?? []).forEach((row) => {
    if (!row?.employeeId) return;
    // First non-empty name wins; a row that carries only the code still offers the code.
    if (!byId.get(row.employeeId)) byId.set(row.employeeId, row.employeeName?.trim() || row.employeeId);
  });
  if (selected && !byId.has(selected)) byId.set(selected, selected);

  return Array.from(byId.entries())
    .map(([value, name]) => ({ value, label: name === value ? value : `${name} (${value})` }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

interface Props {
  /** Defaults to the hook's `loadAttendance`; overridable so a template can drive the load. */
  onRefresh?: () => void;
}

/**
 * The Attendance tab: one row per employee-day the collector derived, for the window in the bar.
 *
 * <b>Everything numeric is `h:mm`.</b> `presentMinutes: 429` is a count; `7:09` is a working day.
 * The columns carry `tabular-nums` so the digits line up down the column — a duration you have to
 * re-read to compare is a duration nobody compares.
 *
 * <b>Empty is two different findings</b> (spec §3). A past range with no rows is a range with no
 * attendance in it. A range that reaches today with no rows is almost always a day that has not
 * been derived yet — the sweep runs tonight — and telling an operator "no attendance" for a day
 * that simply has not been finalized sends them looking for missing people rather than a missing
 * run. A third case sits above both: the last request failed, and the store's durable error says
 * so for anyone who missed the toast.
 *
 * <b>Holiday, leave and LOCKED are rendered, not filtered.</b> A holiday with hours on it (someone
 * worked) and a LOCKED day (settled by a human, which is why re-finalizing it changes nothing) are
 * the rows worth seeing.
 */
const AttendanceTable: React.FC<Props> = ({ onRefresh }) => {
  const query = useHrmWorkforceStore((s) => s.attendanceQuery);
  const rows = useHrmWorkforceStore((s) => s.attendance);
  const loading = useHrmWorkforceStore((s) => s.attendanceLoading);
  const error = useHrmWorkforceStore((s) => s.error);
  const { loadAttendance } = useHrmWorkforceData();
  const canFinalize = useCan(MODULE_CODE, OBJ.FLEET).canEdit;

  const options = useMemo(() => employeeOptions(rows, query.employeeId), [rows, query.employeeId]);

  // A patch over the current query, because each control owns one field and must not have to
  // re-send the others'. The load and the store write happen together inside the hook.
  const apply = (patch: Partial<AttendanceQuery>) => {
    void loadAttendance({ ...query, ...patch });
  };

  const columns: ColumnsType<AttendanceDaily> = [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      width: 220,
      ellipsis: true,
      sorter: (a, b) => (a.employeeName ?? '').localeCompare(b.employeeName ?? ''),
      render: (_, row) => (
        <div style={{ minWidth: 0 }}>
          <div className={styles.cellPrimary}>{row.employeeName?.trim() || row.employeeId || '—'}</div>
          <div className={`${styles.cellSub} ${styles.mono}`}>{row.employeeId || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      width: 150,
      defaultSortOrder: 'descend',
      // ISO `YYYY-MM-DD` sorts lexicographically in date order — no parsing, no timezone.
      sorter: (a, b) => (a.date ?? '').localeCompare(b.date ?? ''),
      render: (_, row) => {
        const d = row.date ? dayjs(row.date, ISO) : null;
        return (
          <div>
            <div className={styles.cellPrimary}>
              {d && d.isValid() ? d.format('ddd, DD MMM YYYY') : row.date || '—'}
            </div>
            {/* The day's outer bounds — the first machine to report and the last one to stop.
                A sub-line rather than a column: it is context for the durations, not a rival to
                them. */}
            <div className={`${styles.cellSub} ${styles.numCell}`}>
              {clock(row.firstIn)} → {clock(row.lastOut)}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Present',
      dataIndex: 'presentMinutes',
      width: 96,
      align: 'right',
      sorter: (a, b) => (a.presentMinutes ?? 0) - (b.presentMinutes ?? 0),
      render: (value: number) => <span className={styles.numCell}>{fmtMinutes(value)}</span>,
    },
    {
      title: 'Active',
      dataIndex: 'activeMinutes',
      width: 96,
      align: 'right',
      sorter: (a, b) => (a.activeMinutes ?? 0) - (b.activeMinutes ?? 0),
      render: (value: number) => <span className={styles.numCell}>{fmtMinutes(value)}</span>,
    },
    {
      title: 'Idle',
      dataIndex: 'idleMinutes',
      width: 96,
      align: 'right',
      sorter: (a, b) => (a.idleMinutes ?? 0) - (b.idleMinutes ?? 0),
      // Idle is a component of present, not a fault — muted so it does not compete with the two
      // numbers a reader is actually comparing.
      render: (value: number) => (
        <span className={`${styles.numCell} ${styles.cellMuted}`}>{fmtMinutes(value)}</span>
      ),
    },
    {
      title: 'Where',
      key: 'location',
      width: 170,
      render: (_, row) => (
        <WfoWfhBar
          office={row.officeMinutes}
          home={row.homeMinutes}
          client={row.clientMinutes}
          other={row.otherMinutes}
        />
      ),
    },
    {
      title: 'Flags',
      key: 'flags',
      width: 190,
      render: (_, row) => {
        const holiday = isHolidayRow(row);
        const leave = isLeaveRow(row);
        const locked = row.state === 'LOCKED';
        if (!holiday && !leave && !locked) return <span className={styles.cellMuted}>—</span>;
        return (
          <span className={styles.flagTags}>
            {holiday ? <Tag color="blue">Holiday</Tag> : null}
            {leave ? (
              <Tag color="purple">{row.leaveType?.trim() ? `Leave · ${row.leaveType.trim()}` : 'Leave'}</Tag>
            ) : null}
            {locked ? (
              <Tooltip title="Settled by a human — finalizing this day again will not re-derive it">
                <Tag>Locked</Tag>
              </Tooltip>
            ) : null}
          </span>
        );
      },
    },
  ];

  // "Reaches today" rather than "is today": a week-long window ending today is the default, and a
  // day that has not been derived yet is the likeliest reason it is empty.
  const includesToday = !!query?.to && query.to >= isoDay(0);

  const emptyText = (
    <div className={styles.emptyState}>
      <div className={styles.emptyTitle}>No attendance in this range.</div>
      {error ? (
        <div className={styles.emptyError}>The last workforce request failed: {error}</div>
      ) : includesToday ? (
        <div className={styles.emptyHint}>
          {canFinalize
            ? 'Today may not be finalized yet — use Finalize day, or wait for tonight’s sweep.'
            : 'Today may not be finalized yet — the nightly sweep derives it.'}
        </div>
      ) : (
        <div className={styles.emptyHint}>
          Nothing was derived for these days. Widen the range, or check that the machines were
          reporting.
        </div>
      )}
    </div>
  );

  return (
    <div>
      <AttendanceQueryBar
        query={query}
        onApply={apply}
        onRefresh={onRefresh ?? (() => void loadAttendance())}
        loading={loading}
        employeeOptions={options}
      />

      <Table<AttendanceDaily>
        // `handle` is the Mongo id and is unique per employee-day; the pair is the same identity
        // for a projection that omits it, and the index is the last resort so two flawed rows
        // cannot collide into one React key and lose the second.
        rowKey={(row, index) =>
          row.handle || (row.employeeId && row.date ? `${row.employeeId}:${row.date}` : `row-${index ?? 0}`)
        }
        size="small"
        columns={columns}
        dataSource={rows}
        loading={loading}
        locale={{ emptyText }}
        scroll={{ x: 'max-content', y: 'calc(100vh - 360px)' }}
        pagination={{
          defaultPageSize: 20,
          size: 'small',
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (count) => `${count} employee-day${count === 1 ? '' : 's'}`,
        }}
      />
    </div>
  );
};

export default AttendanceTable;
