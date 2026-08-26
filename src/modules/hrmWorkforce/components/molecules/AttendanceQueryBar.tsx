'use client';

import React, { useState } from 'react';
import { Button, DatePicker, Select, Tooltip } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { ReloadOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { useCan } from '@/modules/hrmAccess/hooks/useCan';
import FinalizeDayModal from '../organisms/FinalizeDayModal';
import type { AttendanceQuery } from '../../types/ui.types';
import { MAX_RANGE_DAYS, MODULE_CODE, OBJ } from '../../utils/workforceConstants';
import styles from '../../styles/Workforce.module.css';

const { RangePicker } = DatePicker;

/** The wire format for every workforce date field — `AttendanceQuery.from`/`to` are already this. */
const ISO = 'YYYY-MM-DD';

type RangeValue = [Dayjs | null, Dayjs | null] | null;

interface Props {
  /** The window currently on screen — the store's `attendanceQuery`, not a local copy. */
  query: AttendanceQuery;
  /**
   * A patch, applied immediately. The controls in this bar *are* the query: there is no Apply
   * button, because a range that is on screen but not yet fetched is a table that silently
   * disagrees with the picker above it.
   */
  onApply: (patch: Partial<AttendanceQuery>) => void;
  /** Re-ask the server for the same window — for a day the agent is still filling in. */
  onRefresh: () => void;
  loading?: boolean;
  /**
   * Employees offered by the filter. Derived by the table from the rows already loaded (the
   * backend has no employee-directory endpoint on this module), so it narrows a window that has
   * been fetched rather than reaching for one that has not.
   */
  employeeOptions?: Array<{ value: string; label: string }>;
}

/**
 * The Attendance tab's query bar: the date range, an optional employee filter, Refresh, and — for
 * an operator who may write — "Finalize day".
 *
 * <b>Every control here is a server query</b>, unlike the Fleet bar's client-side filters:
 * attendance is fetched per range, so changing the range or the employee re-asks the backend. That
 * is also why `MAX_RANGE_DAYS` is enforced in the picker rather than left to the 400: the backend
 * rejects a range longer than 92 days, and a user who discovers that by reading an error toast has
 * already lost the selection they made.
 *
 * <b>Future days are disabled.</b> Attendance is derived from machine activity that has not
 * happened yet; an empty table for next week is a question nobody asked.
 *
 * <b>The Finalize button is gated on `workforce_fleet` EDIT</b>, the grant the backend's finalize
 * endpoint itself checks — so the button is absent exactly when pressing it would 403, rather than
 * present and disappointing. `useCan` returns all-false until the section cache loads, so the
 * button appears late rather than flashing for someone who may not hold the grant.
 */
const AttendanceQueryBar: React.FC<Props> = ({
  query,
  onApply,
  onRefresh,
  loading,
  employeeOptions = [],
}) => {
  const fleet = useCan(MODULE_CODE, OBJ.FLEET);
  const [finalizeOpen, setFinalizeOpen] = useState(false);

  // What the calendar is *mid-selection*, used only to cap the second click. It is not the query:
  // the query changes on a completed range, so a half-picked range never refetches anything.
  const [picking, setPicking] = useState<RangeValue>(null);

  const from = dayjs(query.from, ISO);
  const to = dayjs(query.to, ISO);
  // A stored bound that will not parse must not render as `Invalid Date` in the picker — it shows
  // an empty picker instead, which the user can simply re-pick.
  const value: RangeValue = from.isValid() && to.isValid() ? [from, to] : null;

  const disabledDate = (current: Dayjs): boolean => {
    if (!current) return false;
    if (current.isAfter(dayjs().endOf('day'))) return true;

    // The cap is measured from whichever end is already chosen. `diff` is exclusive of the second
    // day and the range is inclusive of both, so a 92-day window is a 91-day diff — hence `>=`.
    const anchor = picking?.[0] ?? picking?.[1] ?? null;
    if (!anchor) return false;
    return Math.abs(current.diff(anchor, 'day')) >= MAX_RANGE_DAYS;
  };

  return (
    <div className={styles.attBar}>
      <RangePicker
        size="small"
        allowClear={false}
        value={value}
        format="DD MMM YYYY"
        disabledDate={disabledDate}
        onCalendarChange={(dates) => setPicking(dates as RangeValue)}
        // The half-picked state is scratch space; leaving it set would cap the *next* selection
        // against a date the user has already walked away from.
        onOpenChange={(open) => { if (!open) setPicking(null); }}
        onChange={(dates) => {
          const [start, end] = (dates ?? []) as [Dayjs | null, Dayjs | null];
          if (!start || !end) return;
          onApply({ from: start.format(ISO), to: end.format(ISO) });
        }}
        style={{ width: 260 }}
      />

      <Select<string>
        allowClear
        showSearch
        size="small"
        placeholder="All employees"
        optionFilterProp="label"
        value={query.employeeId || undefined}
        // `allowClear` hands back `undefined`, which the hook turns into "no filter" — an empty
        // string would be sent as a filter on the employee whose code is '', matching nothing.
        onChange={(employeeId) => onApply({ employeeId: employeeId || undefined })}
        options={employeeOptions}
        style={{ minWidth: 220 }}
      />

      <div className={styles.attBarRight}>
        {fleet.canEdit ? (
          <Tooltip title="Re-derive one day's attendance from the machines that reported">
            <Button
              size="small"
              icon={<CheckSquareOutlined />}
              onClick={() => setFinalizeOpen(true)}
            >
              Finalize day
            </Button>
          </Tooltip>
        ) : null}

        <Tooltip title="Re-ask the server for this range">
          <Button size="small" icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>
            Refresh
          </Button>
        </Tooltip>
      </div>

      {/* Mounted only while open so the DatePicker resets to today on each use rather than keeping
          the day somebody finalized an hour ago. */}
      {fleet.canEdit && finalizeOpen ? (
        <FinalizeDayModal open onClose={() => setFinalizeOpen(false)} />
      ) : null}
    </div>
  );
};

export default AttendanceQueryBar;
