'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import dayjs from 'dayjs';
import HealthMetric, { healthSeverity } from '../atoms/HealthMetric';
import AttributionTag from '../atoms/AttributionTag';
import ReportQueryBar from '../molecules/ReportQueryBar';
import { useHrmWorkforceData } from '../../hooks/useHrmWorkforceData';
import { useHrmWorkforceStore } from '../../stores/hrmWorkforceStore';
import type { DeviceHealthRow, DeviceIssue, HealthDayRow } from '../../types/domain.types';
import type { HealthSeverity, ReportQuery, ReportSectionKey } from '../../types/ui.types';
import { fmtPct, fromNowSafe } from '../../utils/workforceFormat';
import styles from '../../styles/Workforce.module.css';

const ISO = 'YYYY-MM-DD';

/** Not readings: `date` identifies the day and `snapshots` counts the samples behind it. */
const METRIC_SKIP = new Set(['date', 'snapshots']);

interface NumericMeta {
  label: string;
  /** `%` routes through `fmtPct`; anything else is appended verbatim. */
  unit?: string;
  /** Which of the detector's three thresholds this reading is scored against, if any. */
  scored?: 'disk' | 'cpu' | 'battery';
}

/**
 * The readings we know how to name and score.
 *
 * ⚠ The temperature field is `tempP95` — the design doc's `tempC` does not exist on the wire, and a
 * tile keyed on the doc's name would render an em dash forever against a backend that is sending
 * the number.
 *
 * `ramP95` and `tempP95` carry no `scored` entry on purpose: `HealthIssueDetector` raises issues on
 * disk, cpu and battery only, so tinting a RAM tile red would put a colour on a row the backend is
 * silent about — a screen-invented alarm nobody can action or clear.
 */
const NUMERIC_META: Record<string, NumericMeta> = {
  diskFreePct: { label: 'Disk free', unit: '%', scored: 'disk' },
  cpuP95: { label: 'CPU p95', unit: '%', scored: 'cpu' },
  ramP95: { label: 'RAM p95', unit: '%' },
  batteryHealthPct: { label: 'Battery health', unit: '%', scored: 'battery' },
  tempP95: { label: 'Temp p95', unit: '°C' },
};

interface BooleanMeta {
  label: string;
  trueLabel: string;
  falseLabel: string;
  /** Whether `false` is a fault the detector would act on. */
  falseIsCrit: boolean;
}

const BOOLEAN_META: Record<string, BooleanMeta> = {
  smartOk: { label: 'SMART', trueLabel: 'Healthy', falseLabel: 'Failing', falseIsCrit: true },
};

/** Reading order — anything not listed still renders, just after these. */
const METRIC_ORDER = ['diskFreePct', 'cpuP95', 'ramP95', 'batteryHealthPct', 'tempP95', 'smartOk'];

/** `swapUsedPct` → `Swap used pct`. Only ever used for a key nobody has named yet. */
const humanize = (key: string): string =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

type MetricEntry =
  | { kind: 'number'; key: string; label: string; unit?: string; value: number | null; severity: HealthSeverity }
  | { kind: 'boolean'; key: string; label: string; value: boolean | null; severity: HealthSeverity };

/**
 * Every reading on a day row, in reading order — <b>iterated off the object, never off a list.</b>
 *
 * This is the load-bearing "data-driven" piece of the panel. The agent decides what it can measure
 * and the backend decides what it stores; a hard-coded tile list would silently drop the next
 * metric either of them adds, and a dropped metric is invisible — the row looks complete and the
 * reading is simply gone. An unknown key gets a label derived from itself, no unit and no tint:
 * shown honestly as an unscored number rather than guessed at.
 */
function metricEntries(day: HealthDayRow | undefined): MetricEntry[] {
  if (!day) return [];
  const rank = (key: string): number => {
    const i = METRIC_ORDER.indexOf(key);
    return i === -1 ? METRIC_ORDER.length : i;
  };

  return Object.entries(day as unknown as Record<string, unknown>)
    .filter(([key, value]) => {
      if (METRIC_SKIP.has(key)) return false;
      // A string is an identifier, not a reading. Numbers, booleans and their nulls are readings —
      // and null is the one that matters most: an unreadable sensor reports nothing, and that
      // absence has to render as an absence rather than vanish from the tile row.
      return value === null || typeof value === 'number' || typeof value === 'boolean';
    })
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([key, value]): MetricEntry => {
      const bool = BOOLEAN_META[key];
      if (bool && (typeof value === 'boolean' || value === null)) {
        const v = value as boolean | null;
        return {
          kind: 'boolean',
          key,
          label: bool.label,
          value: v,
          severity: v === false && bool.falseIsCrit ? 'crit' : 'ok',
        };
      }
      if (typeof value === 'boolean') {
        return {
          kind: 'boolean',
          key,
          label: humanize(key),
          value,
          // An unknown boolean is not scored: only the detector decides what `false` costs.
          severity: 'ok',
        };
      }
      const meta = NUMERIC_META[key];
      const v = typeof value === 'number' ? value : null;
      return {
        kind: 'number',
        key,
        label: meta?.label ?? humanize(key),
        unit: meta?.unit,
        value: v,
        severity: meta?.scored ? healthSeverity(meta.scored, v) : 'ok',
      };
    });
}

/**
 * The most recent day in the window, which is what the tiles show.
 *
 * The list is not assumed to be sorted: it is scanned for the greatest ISO date (`YYYY-MM-DD`
 * compares lexicographically in date order), falling back to the last element when the dates are
 * missing. Taking `days[days.length - 1]` on a list the backend happened to return newest-first
 * would show last week's disk reading as today's — the one number an IT lead would act on.
 */
function latestDay(days: HealthDayRow[] | undefined): HealthDayRow | undefined {
  const list = days ?? [];
  if (list.length === 0) return undefined;
  return list.reduce((best, day) => ((day?.date ?? '') > (best?.date ?? '') ? day : best), list[list.length - 1]);
}

/**
 * An issue counts as open unless it says it is resolved.
 *
 * Deliberately not `status === 'OPEN'`: a status this screen has not seen before would then be
 * filed as closed and disappear from the count, which is the failure mode that hides a fault. An
 * unrecognised status is shown, and shown as open.
 */
const isOpen = (issue: DeviceIssue): boolean => (issue?.status ?? '').trim().toUpperCase() !== 'RESOLVED';

/** Row severity: what the detector would say about this machine right now. */
function rowSeverity(row: DeviceHealthRow, issues: DeviceIssue[]): HealthSeverity {
  if (issues.some(isOpen)) return 'crit';
  return metricEntries(latestDay(row.days)).some((entry) => entry.severity === 'crit') ? 'crit' : 'ok';
}

/**
 * The issues to show against one device: the ones the report joined onto the row, plus any from the
 * site-wide issue list that name the same serial and are not already there (matched by id).
 *
 * The two calls answer slightly different questions — `fleet-health` is windowed, `issues` is not —
 * so an issue raised before the window would otherwise be missing from the very row it is about.
 */
function issuesFor(row: DeviceHealthRow, all: DeviceIssue[]): DeviceIssue[] {
  const own = row.issues ?? [];
  const seen = new Set(own.map((issue) => issue?.id).filter(Boolean));
  const extra = (all ?? []).filter(
    (issue) => issue?.serialNumber === row.serialNumber && (!issue.id || !seen.has(issue.id)),
  );
  return [...own, ...extra];
}

// ── Issue list ─────────────────────────────────────────────────────────

const IssueList: React.FC<{ issues: DeviceIssue[] }> = ({ issues }) => (
  <ul className={styles.listPlain}>
    {issues.map((issue, index) => {
      const open = isOpen(issue);
      return (
        <li key={issue.id || `${issue.issueType}-${index}`} className={styles.issueItem}>
          <div className={styles.issueHead}>
            <Tag color={open ? 'error' : 'default'}>{open ? issue.status?.trim() || 'OPEN' : 'RESOLVED'}</Tag>
            <span className={styles.issueType}>{issue.issueType?.trim() || 'ISSUE'}</span>
            {issue.ticketId?.trim() ? (
              // The Tickets module has no per-ticket route, so this opens the module rather than
              // the ticket. Said out loud in the tooltip: a link that quietly lands somewhere other
              // than its label promises is worse than one that admits where it goes.
              <Tooltip title={`Raised as ${issue.ticketId.trim()} — opens the Tickets module`}>
                <Link href="/rits/hrm_ticket_app" className={`${styles.ticketLink} ${styles.mono}`}>
                  {issue.ticketId.trim()}
                </Link>
              </Tooltip>
            ) : (
              <Tooltip title="No ticket was raised for this issue">
                <span className={styles.cellMuted}>no ticket</span>
              </Tooltip>
            )}
          </div>
          {issue.detail?.trim() ? <div className={styles.issueDetail}>{issue.detail.trim()}</div> : null}
          <div className={styles.issueMeta}>
            {issue.serialNumber ? <span className={styles.mono}>{issue.serialNumber}</span> : null}
            <span>Opened {fromNowSafe(issue.openedAt)}</span>
            {!open && issue.resolvedAt ? <span>Resolved {fromNowSafe(issue.resolvedAt)}</span> : null}
          </div>
        </li>
      );
    })}
  </ul>
);

// ── The expanded detail ────────────────────────────────────────────────

const DeviceHealthDetail: React.FC<{ row: DeviceHealthRow; issues: DeviceIssue[] }> = ({ row, issues }) => {
  const days = row.days ?? [];
  const last = latestDay(days);
  const tiles = metricEntries(last);

  // Each day's readings, derived once and keyed by the row object itself. A cell renderer that
  // called `metricEntries` for its own column would re-walk the whole day for every column of
  // every row — six times the work, on every re-render, for one table. Keyed by identity rather
  // than by date so a day row with a missing date cannot collide with another.
  const entriesByDay = useMemo(() => {
    const map = new Map<HealthDayRow, MetricEntry[]>();
    days.forEach((day) => map.set(day, metricEntries(day)));
    return map;
  }, [days]);

  // Trend columns are the union of the readings actually present across the window, so a metric
  // that only started being collected mid-window still gets a column (and em dashes before it).
  const trendKeys = useMemo(() => {
    const order = new Map<string, number>();
    days.forEach((day) => (entriesByDay.get(day) ?? []).forEach((entry, index) => {
      if (!order.has(entry.key)) order.set(entry.key, index);
    }));
    return Array.from(order.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([key]) => key);
  }, [days, entriesByDay]);

  const trendColumns: ColumnsType<HealthDayRow> = [
    {
      title: 'Date',
      dataIndex: 'date',
      width: 140,
      render: (_, day) => {
        const d = day.date ? dayjs(day.date, ISO) : null;
        return <span className={styles.cellPrimary}>{d && d.isValid() ? d.format('ddd, DD MMM') : day.date || '—'}</span>;
      },
    },
    ...trendKeys.map((key) => ({
      title: NUMERIC_META[key]?.label ?? BOOLEAN_META[key]?.label ?? humanize(key),
      key,
      width: 110,
      align: 'right' as const,
      render: (_: unknown, day: HealthDayRow) => {
        const entry = (entriesByDay.get(day) ?? metricEntries(day)).find((e) => e.key === key);
        if (!entry) return <span className={styles.healthAbsent}>—</span>;
        if (entry.kind === 'boolean') {
          if (entry.value === null) return <span className={styles.healthAbsent}>—</span>;
          const meta = BOOLEAN_META[key];
          return (
            <span className={entry.severity === 'crit' ? styles.sevCrit : undefined}>
              {entry.value ? meta?.trueLabel ?? 'Yes' : meta?.falseLabel ?? 'No'}
            </span>
          );
        }
        const text =
          entry.unit === '%'
            ? fmtPct(entry.value)
            : entry.value === null
              ? '—'
              : `${Math.round(entry.value)}${entry.unit ?? ''}`;
        return (
          <span
            className={`${styles.numCell} ${
              entry.value === null ? styles.healthAbsent : entry.severity === 'crit' ? styles.sevCrit : ''
            }`}
          >
            {text}
          </span>
        );
      },
    })),
    {
      title: 'Samples',
      dataIndex: 'snapshots',
      width: 100,
      align: 'right',
      // The sample count is the credibility of the row above it: a p95 over three snapshots is not
      // the same claim as a p95 over three hundred.
      render: (value: number) => <span className={`${styles.numCell} ${styles.cellMuted}`}>{value ?? 0}</span>,
    },
  ];

  return (
    <div className={styles.repDetail}>
      <section className={styles.repSection}>
        <h4 className={styles.repSectionTitle}>
          Latest readings
          {last?.date ? <span className={styles.repSectionCount}> · {last.date}</span> : null}
        </h4>
        {tiles.length === 0 ? (
          <div className={styles.sectionHint}>
            This device reported no health snapshot in the window — it may have been off, or the
            agent may not be running on it.
          </div>
        ) : (
          <div className={styles.metricRow}>
            {tiles.map((entry) =>
              entry.kind === 'number' ? (
                <HealthMetric
                  key={entry.key}
                  label={entry.label}
                  value={entry.value}
                  unit={entry.unit}
                  severity={entry.severity}
                  tooltip={last?.date ? `Reading for ${last.date}` : undefined}
                />
              ) : (
                <div key={entry.key} className={styles.healthMetric}>
                  <span className={styles.healthLabel}>{entry.label}</span>
                  <span
                    className={`${styles.healthValue} ${
                      entry.value === null
                        ? styles.healthAbsent
                        : entry.severity === 'crit'
                          ? styles.sevCrit
                          : styles.sevOk
                    }`}
                  >
                    {entry.value === null
                      ? '—'
                      : entry.value
                        ? BOOLEAN_META[entry.key]?.trueLabel ?? 'Yes'
                        : BOOLEAN_META[entry.key]?.falseLabel ?? 'No'}
                  </span>
                </div>
              ),
            )}
          </div>
        )}
      </section>

      <section className={styles.repSection}>
        <h4 className={styles.repSectionTitle}>
          Issues{issues.length ? <span className={styles.repSectionCount}> · {issues.length}</span> : null}
        </h4>
        {issues.length === 0 ? (
          <div className={styles.sectionHint}>No issue has been raised against this device.</div>
        ) : (
          <IssueList issues={issues} />
        )}
      </section>

      <section className={styles.repSection}>
        <h4 className={styles.repSectionTitle}>Day by day</h4>
        {days.length === 0 ? (
          <div className={styles.sectionHint}>No health days in this window.</div>
        ) : (
          <Table<HealthDayRow>
            rowKey={(day, index) => day.date || `day-${index ?? 0}`}
            size="small"
            columns={trendColumns}
            dataSource={days}
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        )}
      </section>
    </div>
  );
};

// ── The panel ──────────────────────────────────────────────────────────

interface Props {
  section: ReportSectionKey;
  onSectionChange: (section: ReportSectionKey) => void;
  /** Overrides the panel's own loader — a template that wants to drive the fetch itself may pass one. */
  onRefresh?: () => void;
}

/**
 * Reports → Fleet Health: what each machine's sensors said, and what the detector holds against it.
 *
 * <b>The two loads run concurrently, and that is a correctness requirement, not a speed one.</b>
 * Every loader in the hook clears the store's single shared `error` on entry, so awaiting the
 * health load and *then* the issues load would wipe a health failure the moment the issues call
 * started — the table would go empty with nothing to explain it. Firing both together means both
 * clear the slot before either can fail, so whichever fails is the message that survives.
 *
 * <b>The panel also keeps its own loading flag and its own last-run verdict</b>, because the store
 * holds one `reportLoading` for three slots: the first of the two calls to finish clears it while
 * the other is still in flight, which would show a finished-looking screen that is still filling in.
 *
 * <b>Every reading is iterated off the response.</b> See `metricEntries` — the tiles and the trend
 * columns are whatever the day rows carry, so a metric added upstream appears here with no change.
 */
const FleetHealthPanel: React.FC<Props> = ({ section, onSectionChange, onRefresh }) => {
  const query = useHrmWorkforceStore((s) => s.reportQuery);
  const rows = useHrmWorkforceStore((s) => s.fleetHealth);
  const allIssues = useHrmWorkforceStore((s) => s.issues);
  const fleet = useHrmWorkforceStore((s) => s.fleet);
  const sharedLoading = useHrmWorkforceStore((s) => s.reportLoading);
  const sharedError = useHrmWorkforceStore((s) => s.error);
  const { loadHealth, loadIssues } = useHrmWorkforceData();

  const [busy, setBusy] = useState(false);
  const [lastRun, setLastRun] = useState<{ error: string | null } | null>(null);

  const run = useCallback(
    async (q?: ReportQuery) => {
      setBusy(true);
      try {
        // Started together, not one after the other — see the component note above.
        await Promise.all([loadHealth(q), loadIssues()]);
      } finally {
        setLastRun({ error: useHrmWorkforceStore.getState().error });
        setBusy(false);
      }
    },
    [loadHealth, loadIssues],
  );

  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if ((rows?.length ?? 0) === 0) void run();
    // Mount only — see UtilizationPanel for why this panel loads itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Serials to filter by: whatever health rows are on screen, plus the fleet list if it is loaded. */
  const serialOptions = useMemo(() => {
    const byId = new Map<string, string>();
    const add = (serial?: string | null, hostname?: string | null) => {
      if (!serial) return;
      if (!byId.get(serial)) byId.set(serial, hostname?.trim() || serial);
    };
    (rows ?? []).forEach((row) => add(row.serialNumber, row.hostname));
    (fleet ?? []).forEach((row) => add(row.serialNumber, row.hostname));
    if (query.serialNumber && !byId.has(query.serialNumber)) byId.set(query.serialNumber, query.serialNumber);
    return Array.from(byId.entries())
      .map(([value, host]) => ({ value, label: host === value ? value : `${host} (${value})` }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rows, fleet, query.serialNumber]);

  // The joined issue list per row, derived once. The Condition column, the count column, that
  // column's sorter and the expanded detail all ask the same question, and the sorter alone asks
  // it O(n log n) times — recomputing the join in each of them turns one merge into hundreds.
  const issuesByRow = useMemo(() => {
    const map = new Map<DeviceHealthRow, DeviceIssue[]>();
    (rows ?? []).forEach((row) => map.set(row, issuesFor(row, allIssues)));
    return map;
  }, [rows, allIssues]);
  const rowIssues = useCallback(
    (row: DeviceHealthRow): DeviceIssue[] => issuesByRow.get(row) ?? issuesFor(row, allIssues),
    [issuesByRow, allIssues],
  );

  const [expanded, setExpanded] = useState<React.Key[]>([]);
  useEffect(() => {
    setExpanded(rows?.length === 1 && rows[0]?.serialNumber ? [rows[0].serialNumber] : []);
  }, [rows]);

  const apply = (patch: Partial<ReportQuery>) => {
    void run({ ...query, ...patch });
  };

  const loading = busy || sharedLoading;
  const error = lastRun ? lastRun.error : sharedError;

  /**
   * Open issues whose serial is on no row of this report — a machine the health window did not
   * return (never reported, or outside the range) that the detector is nonetheless holding a fault
   * against. Suppressed while a single device is selected, where "everything else" is not a finding.
   */
  const orphanIssues = useMemo(() => {
    if (query.serialNumber) return [];
    const known = new Set((rows ?? []).map((row) => row.serialNumber));
    return (allIssues ?? []).filter((issue) => isOpen(issue) && !known.has(issue.serialNumber));
  }, [allIssues, rows, query.serialNumber]);

  const columns: ColumnsType<DeviceHealthRow> = [
    {
      title: 'Device',
      dataIndex: 'hostname',
      width: 230,
      ellipsis: true,
      sorter: (a, b) => (a.hostname ?? '').localeCompare(b.hostname ?? ''),
      render: (_, row) => (
        <div style={{ minWidth: 0 }}>
          <div className={styles.cellPrimary}>{row.hostname?.trim() || row.serialNumber || '—'}</div>
          <div className={`${styles.cellSub} ${styles.mono}`}>{row.serialNumber || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Model',
      dataIndex: 'model',
      width: 170,
      ellipsis: true,
      render: (value: string) => <span className={styles.cellSub}>{value?.trim() || '—'}</span>,
    },
    {
      title: 'Holder',
      key: 'holder',
      width: 200,
      // A device nobody holds still gets a health report — the amber tag says the asset register
      // has drifted, which is a finding in itself.
      render: (_, row) => (
        <AttributionTag employeeName={row.currentHolderName} employeeCode={row.currentHolderEmployeeId} />
      ),
    },
    {
      title: 'Condition',
      key: 'condition',
      width: 130,
      render: (_, row) => {
        const issues = rowIssues(row);
        const severity = rowSeverity(row, issues);
        const open = issues.filter(isOpen).length;
        return severity === 'crit' ? (
          <Tooltip title={open > 0 ? `${open} open issue${open === 1 ? '' : 's'}` : 'A reading is past the detector’s threshold'}>
            <Tag color="error">Critical</Tag>
          </Tooltip>
        ) : (
          <Tag>OK</Tag>
        );
      },
    },
    {
      title: 'Open issues',
      key: 'issues',
      width: 110,
      align: 'right',
      sorter: (a, b) => rowIssues(a).filter(isOpen).length - rowIssues(b).filter(isOpen).length,
      render: (_, row) => {
        const open = rowIssues(row).filter(isOpen).length;
        return <span className={`${styles.numCell} ${open > 0 ? styles.sevCrit : styles.cellMuted}`}>{open}</span>;
      },
    },
    {
      title: 'Last seen',
      dataIndex: 'lastSeenAt',
      width: 150,
      render: (value: string | null) => <span className={styles.cellSub}>{fromNowSafe(value)}</span>,
    },
    {
      title: 'Days',
      key: 'days',
      width: 80,
      align: 'right',
      render: (_, row) => (
        <span className={`${styles.numCell} ${styles.cellMuted}`}>{row.days?.length ?? 0}</span>
      ),
    },
  ];

  const emptyText = (
    <div className={styles.emptyState}>
      <div className={styles.emptyTitle}>No device health in this window.</div>
      {error ? (
        <div className={styles.emptyError}>The last workforce request failed: {error}</div>
      ) : (
        <div className={styles.emptyHint}>
          No machine reported a health snapshot in this range. Widen the range, clear the device
          filter, or check that the agents are running.
        </div>
      )}
    </div>
  );

  return (
    <div>
      <ReportQueryBar
        query={query}
        section={section}
        onSectionChange={onSectionChange}
        onApply={apply}
        onRefresh={onRefresh ?? (() => void run())}
        loading={loading}
        serialOptions={serialOptions}
      />

      {error && (rows?.length ?? 0) > 0 ? (
        <div className={styles.repError}>The last workforce request failed: {error}</div>
      ) : null}

      <Table<DeviceHealthRow>
        rowKey={(row, index) => row.serialNumber || `row-${index ?? 0}`}
        size="small"
        columns={columns}
        dataSource={rows}
        loading={loading}
        locale={{ emptyText }}
        rowClassName={(row) => (row.status === 'REVOKED' ? styles.rowRevoked : '')}
        expandable={{
          expandedRowKeys: expanded,
          onExpandedRowsChange: (keys) => setExpanded([...keys]),
          expandedRowRender: (row) => <DeviceHealthDetail row={row} issues={rowIssues(row)} />,
          rowExpandable: () => true,
        }}
        scroll={{ x: 'max-content' }}
        pagination={{
          defaultPageSize: 10,
          size: 'small',
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (count) => `${count} device${count === 1 ? '' : 's'}`,
        }}
      />

      {orphanIssues.length > 0 ? (
        <section className={`${styles.repSection} ${styles.orphanSection}`}>
          <h4 className={styles.repSectionTitle}>
            Open issues on devices not in this report
            <span className={styles.repSectionCount}> · {orphanIssues.length}</span>
          </h4>
          {/* These are the faults a windowed report hides: the machine stopped reporting, so it has
              no health days in the range and drops off the table above — while the issue that was
              raised against it stays open. */}
          <IssueList issues={orphanIssues} />
        </section>
      ) : null}
    </div>
  );
};

export default FleetHealthPanel;
