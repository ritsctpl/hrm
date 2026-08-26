'use client';

import React, { useState } from 'react';
import { Button, DatePicker, Segmented, Select, Tooltip } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { ReloadOutlined } from '@ant-design/icons';
import type { ReportQuery, ReportSectionKey } from '../../types/ui.types';
import { MAX_RANGE_DAYS } from '../../utils/workforceConstants';
import styles from '../../styles/Workforce.module.css';

const { RangePicker } = DatePicker;

/** The wire format for every workforce date field — `ReportQuery.from`/`to` are already this. */
const ISO = 'YYYY-MM-DD';

type RangeValue = [Dayjs | null, Dayjs | null] | null;

const SECTIONS: Array<{ label: string; value: ReportSectionKey }> = [
  { label: 'Utilization', value: 'utilization' },
  { label: 'Fleet Health', value: 'health' },
];

interface Props {
  /** The window currently on screen — the store's `reportQuery`, not a local copy. */
  query: ReportQuery;
  /** Which report is showing. Owned by the parent so the toggle survives a panel remount. */
  section: ReportSectionKey;
  onSectionChange: (section: ReportSectionKey) => void;
  /**
   * A patch, applied immediately — the controls in this bar *are* the query. There is no Apply
   * button, for the same reason the attendance bar has none: a range on screen that has not been
   * fetched is a table that silently disagrees with the picker above it.
   */
  onApply: (patch: Partial<ReportQuery>) => void;
  /** Re-ask the server for the same window. */
  onRefresh: () => void;
  loading?: boolean;
  /**
   * Employees offered on the Utilization section. Derived by the panel from rows already loaded —
   * this module has no employee-directory endpoint, so the filter narrows a window that has been
   * fetched rather than reaching for one that has not.
   */
  employeeOptions?: Array<{ value: string; label: string }>;
  /** Serials offered on the Fleet Health section, derived the same way from the fleet/health rows. */
  serialOptions?: Array<{ value: string; label: string }>;
}

/**
 * The Reports tab's one query bar: the section toggle, the date range, the section's own narrowing
 * filter, and Refresh.
 *
 * <b>One bar, one Segmented.</b> The toggle lives here rather than in the template above it because
 * the range and the filter belong to the same question the toggle is asking — separating them puts
 * a control that changes the whole screen in one box and the controls that change the query in
 * another, and the two then style and align independently. The parent still *owns* the value
 * (`section` / `onSectionChange`) so switching sections does not lose it to a panel unmount.
 *
 * <b>The filter is section-specific on purpose.</b> `employeeId` narrows utilization and
 * `serialNumber` narrows fleet health; neither endpoint reads the other's field. Showing both at
 * once would offer a control that provably does nothing to the table underneath it.
 *
 * <b>The employee filter is not a nicety on the Utilization section — it is what fills `days[]`.</b>
 * A site-wide utilization call answers with one row per employee and an EMPTY `days` list; only a
 * call that names an employee carries the day-by-day breakdown. The placeholder says so, so the
 * missing breakdown reads as "you did not ask for it" rather than "there is no data".
 *
 * <b>Future days are disabled and the range is capped</b> at `MAX_RANGE_DAYS`, matching the
 * attendance bar. The cap is this module's only verified server-side range limit
 * (`AttendanceController`); the report endpoints may well accept more, but a window that is a
 * quarter wide is already past the point where the per-day tables stay readable, and discovering a
 * limit by reading an error toast costs the user the selection they just made.
 */
const ReportQueryBar: React.FC<Props> = ({
  query,
  section,
  onSectionChange,
  onApply,
  onRefresh,
  loading,
  employeeOptions = [],
  serialOptions = [],
}) => {
  // What the calendar is *mid-selection*, used only to cap the second click — never the query.
  const [picking, setPicking] = useState<RangeValue>(null);

  const from = dayjs(query.from, ISO);
  const to = dayjs(query.to, ISO);
  // A stored bound that will not parse must not render as `Invalid Date`; an empty picker is
  // something the user can simply re-pick.
  const value: RangeValue = from.isValid() && to.isValid() ? [from, to] : null;

  const disabledDate = (current: Dayjs): boolean => {
    if (!current) return false;
    if (current.isAfter(dayjs().endOf('day'))) return true;
    const anchor = picking?.[0] ?? picking?.[1] ?? null;
    if (!anchor) return false;
    // `diff` excludes the second day and the range includes both ends, so a 92-day window is a
    // 91-day diff — hence `>=`.
    return Math.abs(current.diff(anchor, 'day')) >= MAX_RANGE_DAYS;
  };

  return (
    <div className={styles.repBar}>
      <Segmented<ReportSectionKey>
        size="small"
        value={section}
        onChange={(next) => onSectionChange(next)}
        options={SECTIONS}
      />

      <RangePicker
        size="small"
        allowClear={false}
        value={value}
        format="DD MMM YYYY"
        disabledDate={disabledDate}
        onCalendarChange={(dates) => setPicking(dates as RangeValue)}
        // Scratch space: leaving it set would cap the *next* selection against a date the user has
        // already walked away from.
        onOpenChange={(open) => { if (!open) setPicking(null); }}
        onChange={(dates) => {
          const [start, end] = (dates ?? []) as [Dayjs | null, Dayjs | null];
          if (!start || !end) return;
          onApply({ from: start.format(ISO), to: end.format(ISO) });
        }}
        style={{ width: 260 }}
      />

      {section === 'utilization' ? (
        // A native `title` rather than an AntD <Tooltip>: a floating overlay anchored to a Select
        // sits over the dropdown it is explaining, so the hint would cover the options the moment
        // the user acts on it.
        <span title="Naming an employee is what returns the day-by-day breakdown — a site-wide query answers with totals only.">
          <Select<string>
            allowClear
            showSearch
            size="small"
            placeholder="All employees (totals only)"
            optionFilterProp="label"
            value={query.employeeId || undefined}
            // `allowClear` hands back `undefined`, which the hook turns into "no filter". An empty
            // string would be sent as a filter on the employee whose code is '', matching nothing.
            onChange={(employeeId) => onApply({ employeeId: employeeId || undefined })}
            options={employeeOptions}
            style={{ minWidth: 240 }}
          />
        </span>
      ) : (
        <Select<string>
          allowClear
          showSearch
          size="small"
          placeholder="All devices"
          optionFilterProp="label"
          value={query.serialNumber || undefined}
          onChange={(serialNumber) => onApply({ serialNumber: serialNumber || undefined })}
          options={serialOptions}
          style={{ minWidth: 240 }}
        />
      )}

      <div className={styles.repBarRight}>
        <Tooltip title="Re-ask the server for this window">
          <Button size="small" icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>
            Refresh
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default ReportQueryBar;
