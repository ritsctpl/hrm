'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import WfoWfhBar from '../molecules/WfoWfhBar';
import ReportQueryBar from '../molecules/ReportQueryBar';
import { useHrmWorkforceData } from '../../hooks/useHrmWorkforceData';
import { useHrmWorkforceStore } from '../../stores/hrmWorkforceStore';
import type {
  AppMinutes,
  DomainMinutes,
  EmployeeUtilizationView,
  NamedMinutes,
  RangeTotals,
  UtilizationDayRow,
} from '../../types/domain.types';
import type { ReportQuery, ReportSectionKey } from '../../types/ui.types';
import { fmtMinutes } from '../../utils/workforceFormat';
import styles from '../../styles/Workforce.module.css';

const ISO = 'YYYY-MM-DD';

/**
 * The minute fields we know how to name, in the order they read best. Anything else the backend
 * adds to `totals` is still rendered — see `minuteStats` — it just lands after these with a label
 * derived from its own key. That is the whole point: a `travelMinutes` shipped next quarter shows
 * up on this screen with no code change here.
 */
const TOTAL_ORDER = [
  'presentMinutes',
  'activeMinutes',
  'idleMinutes',
  'officeMinutes',
  'homeMinutes',
  'clientMinutes',
  'otherMinutes',
];

const TOTAL_LABELS: Record<string, string> = {
  presentMinutes: 'Present',
  activeMinutes: 'Active',
  idleMinutes: 'Idle',
  officeMinutes: 'Office',
  homeMinutes: 'Home (WFH)',
  clientMinutes: 'Client site',
  otherMinutes: 'Other',
};

/** `travelMinutes` → `Travel`. Only ever used for a key nobody has named yet. */
const humanize = (key: string): string =>
  key
    .replace(/Minutes$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

interface MinuteStat {
  key: string;
  label: string;
  minutes: number;
}

/**
 * Every `*Minutes` field on a totals object, named and ordered — iterated, never listed.
 *
 * `days` is deliberately excluded here and rendered separately: it is a count of derived days, not
 * a duration, and running it through `fmtMinutes` would print a working week as `0:05`.
 */
function minuteStats(totals: RangeTotals | undefined): MinuteStat[] {
  const rank = (key: string): number => {
    const i = TOTAL_ORDER.indexOf(key);
    return i === -1 ? TOTAL_ORDER.length : i;
  };
  return Object.entries(totals ?? {})
    // `null` counts as a field that arrived. A `*Minutes` key the backend sent as null is a number
    // it could not compute, not a field it does not have — dropping it would take the LABEL off the
    // header too, so an operator would see six stats where the row has seven and never know which
    // one went missing. It renders as `0:00`, which is what `fmtMinutes` makes of an absent count
    // anyway; the point of keeping it is that the header stays complete.
    .filter(([key, value]) => key.endsWith('Minutes') && (typeof value === 'number' || value === null))
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([key, value]) => ({
      key,
      label: TOTAL_LABELS[key] ?? humanize(key),
      minutes: typeof value === 'number' ? value : 0,
    }));
}

/** A proportional width, guarded: an all-zero list must not divide by zero and print `NaN%`. */
const share = (value: number, max: number): string =>
  max > 0 && value > 0 ? `${Math.max(2, Math.round((value / max) * 100))}%` : '0%';

const num = (n: number | null | undefined): number =>
  typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0;

/** `HH:mm` for an ISO instant, or an em dash — a day with no first-in is a real row. */
const clock = (iso: string | null): string => {
  if (!iso) return '—';
  const d = dayjs(iso);
  return d.isValid() ? d.format('HH:mm') : '—';
};

// ── The expanded detail ────────────────────────────────────────────────

/**
 * One employee's window, opened up: the working-hours header, then what the time was spent in.
 *
 * Every list here is `.map`ped over what the response carried — categories, applications, domains
 * and machines are all open sets the backend decides. A hard-coded category list would quietly drop
 * a new one, and a dropped category is invisible: the screen looks complete and the minutes are
 * simply gone.
 */
const UtilizationDetail: React.FC<{ row: EmployeeUtilizationView }> = ({ row }) => {
  const stats = minuteStats(row.totals);
  const categories = Object.entries(row.categoryMinutes ?? {})
    // Same reasoning as `minuteStats`: a category whose minutes came back null is a category that
    // was seen, and hiding it hides the category name as well as the number.
    .filter(([, minutes]) => typeof minutes === 'number' || minutes === null)
    .map(([category, minutes]): [string, number] => [category, typeof minutes === 'number' ? minutes : 0])
    .sort((a, b) => b[1] - a[1]);
  const apps: AppMinutes[] = row.apps ?? [];
  const domains: DomainMinutes[] = row.domains ?? [];
  const machines: NamedMinutes[] = row.machines ?? [];
  const days: UtilizationDayRow[] = row.days ?? [];

  const appMax = apps.reduce((m, a) => Math.max(m, num(a.minutes)), 0);
  const domainMax = domains.reduce((m, d) => Math.max(m, num(d.minutes)), 0);
  const machineMax = machines.reduce((m, x) => Math.max(m, num(x.minutes)), 0);

  // `appCount` is the true number of distinct applications; `apps` is the head of that list. The
  // difference is what "and N more" has to say — computed from the two numbers rather than from a
  // fixed page size, because the backend owns how much it sends.
  const hiddenApps = Math.max(0, (row.appCount ?? apps.length) - apps.length);
  const hiddenDomains = Math.max(0, (row.domainCount ?? domains.length) - domains.length);

  const dayColumns: ColumnsType<UtilizationDayRow> = [
    {
      title: 'Date',
      dataIndex: 'date',
      width: 190,
      render: (_, day) => {
        const d = day.date ? dayjs(day.date, ISO) : null;
        return (
          <div>
            <div className={styles.cellPrimary}>
              {d && d.isValid() ? d.format('ddd, DD MMM') : day.date || '—'}
            </div>
            <div className={`${styles.cellSub} ${styles.numCell}`}>
              {clock(day.firstIn)} → {clock(day.lastOut)}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Present',
      dataIndex: 'presentMinutes',
      width: 90,
      align: 'right',
      render: (value: number) => <span className={styles.numCell}>{fmtMinutes(value)}</span>,
    },
    {
      title: 'Active',
      dataIndex: 'activeMinutes',
      width: 90,
      align: 'right',
      render: (value: number) => <span className={styles.numCell}>{fmtMinutes(value)}</span>,
    },
    {
      title: 'Idle',
      dataIndex: 'idleMinutes',
      width: 90,
      align: 'right',
      render: (value: number) => (
        <span className={`${styles.numCell} ${styles.cellMuted}`}>{fmtMinutes(value)}</span>
      ),
    },
    {
      title: 'Where',
      key: 'where',
      width: 150,
      render: (_, day) => (
        <WfoWfhBar
          office={day.officeMinutes}
          home={day.homeMinutes}
          client={day.clientMinutes}
          other={day.otherMinutes}
        />
      ),
    },
    {
      title: 'Flags',
      key: 'flags',
      width: 180,
      render: (_, day) => {
        const locked = day.state === 'LOCKED';
        if (!day.holiday && !day.leaveDay && !locked) return <span className={styles.cellMuted}>—</span>;
        return (
          <span className={styles.flagTags}>
            {day.holiday ? <Tag color="blue">Holiday</Tag> : null}
            {day.leaveDay ? (
              <Tag color="purple">{day.leaveType?.trim() ? `Leave · ${day.leaveType.trim()}` : 'Leave'}</Tag>
            ) : null}
            {locked ? (
              <Tooltip title="Settled by a human — re-deriving this day will not change it">
                <Tag>Locked</Tag>
              </Tooltip>
            ) : null}
          </span>
        );
      },
    },
  ];

  return (
    <div className={styles.repDetail}>
      {/* Working-hours header. Iterated over whatever `totals` carries, so it can only ever be
          complete. `days` sits alongside as a count, not a duration. */}
      <div className={styles.statRow}>
        <div className={styles.stat}>
          <span className={`${styles.statValue} ${styles.numCell}`}>{num(row.totals?.days)}</span>
          <span className={styles.statLabel}>Days derived</span>
        </div>
        {stats.map((stat) => (
          <div key={stat.key} className={styles.stat}>
            <span className={`${styles.statValue} ${styles.numCell}`}>{fmtMinutes(stat.minutes)}</span>
            <span className={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.repGrid}>
        {/* ── Categories ───────────────────────────────────────────── */}
        <section className={styles.repSection}>
          <h4 className={styles.repSectionTitle}>Time by category</h4>
          {categories.length === 0 ? (
            <div className={styles.sectionHint}>No categorised time in this window.</div>
          ) : (
            <div className={styles.flagTags}>
              {categories.map(([category, minutes]) => (
                <Tag key={category} className={styles.catTag}>
                  {category} · <span className={styles.numCell}>{fmtMinutes(minutes)}</span>
                </Tag>
              ))}
            </div>
          )}
        </section>

        {/* ── Applications ─────────────────────────────────────────── */}
        <section className={styles.repSection}>
          <h4 className={styles.repSectionTitle}>
            Applications{row.appCount ? <span className={styles.repSectionCount}> · {row.appCount}</span> : null}
          </h4>
          {apps.length === 0 ? (
            <div className={styles.sectionHint}>No application time recorded in this window.</div>
          ) : (
            <ul className={styles.listPlain}>
              {apps.map((app, index) => (
                <li key={`${app.app}-${index}`} className={styles.listRow}>
                  <span className={styles.listName} title={app.app}>
                    {app.app || '—'}
                  </span>
                  {/* The category comes off the row, never off a lookup here — the backend owns the
                      taxonomy and a locally-invented one would drift from it silently. */}
                  {app.category ? <Tag className={styles.catTag}>{app.category}</Tag> : null}
                  <span className={styles.listBarTrack}>
                    <i className={styles.listBar} style={{ width: share(num(app.minutes), appMax) }} />
                  </span>
                  <span className={`${styles.listMeta} ${styles.numCell}`}>{fmtMinutes(app.minutes)}</span>
                </li>
              ))}
            </ul>
          )}
          {row.appsTruncated || hiddenApps > 0 ? (
            <div className={styles.truncNote}>
              {hiddenApps > 0
                ? `and ${hiddenApps} more application${hiddenApps === 1 ? '' : 's'} not shown`
                : 'more applications than shown'}
            </div>
          ) : null}
        </section>

        {/* ── Domains ──────────────────────────────────────────────── */}
        <section className={styles.repSection}>
          <h4 className={styles.repSectionTitle}>
            Top domains
            {row.domainCount ? <span className={styles.repSectionCount}> · {row.domainCount}</span> : null}
          </h4>
          {domains.length === 0 ? (
            <div className={styles.sectionHint}>No browsing recorded in this window.</div>
          ) : (
            <ul className={styles.listPlain}>
              {domains.map((entry, index) => (
                <li key={`${entry.domain}-${index}`} className={styles.listRow}>
                  <span className={styles.listName} title={entry.domain}>
                    {entry.domain || '—'}
                  </span>
                  <span className={`${styles.listMeta} ${styles.numCell}`}>
                    {num(entry.visits)} visit{num(entry.visits) === 1 ? '' : 's'}
                  </span>
                  <span className={styles.listBarTrack}>
                    <i className={styles.listBar} style={{ width: share(num(entry.minutes), domainMax) }} />
                  </span>
                  <span className={`${styles.listMeta} ${styles.numCell}`}>{fmtMinutes(entry.minutes)}</span>
                </li>
              ))}
            </ul>
          )}
          {row.domainsTruncated || hiddenDomains > 0 ? (
            <div className={styles.truncNote}>
              {hiddenDomains > 0
                ? `and ${hiddenDomains} more domain${hiddenDomains === 1 ? '' : 's'} not shown`
                : 'more domains than shown'}
            </div>
          ) : null}
        </section>

        {/* ── Machines ─────────────────────────────────────────────── */}
        <section className={styles.repSection}>
          <h4 className={styles.repSectionTitle}>Machines</h4>
          {machines.length === 0 ? (
            <div className={styles.sectionHint}>
              No machine reported time for this employee — check the asset register.
            </div>
          ) : (
            <ul className={styles.listPlain}>
              {machines.map((machine, index) => (
                <li key={`${machine.name}-${index}`} className={styles.listRow}>
                  <span className={`${styles.listName} ${styles.mono}`} title={machine.name}>
                    {machine.name || '—'}
                  </span>
                  <span className={styles.listBarTrack}>
                    <i className={styles.listBar} style={{ width: share(num(machine.minutes), machineMax) }} />
                  </span>
                  <span className={`${styles.listMeta} ${styles.numCell}`}>{fmtMinutes(machine.minutes)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── Day by day ─────────────────────────────────────────────── */}
      <section className={styles.repSection}>
        <h4 className={styles.repSectionTitle}>Day by day</h4>
        {days.length === 0 ? (
          // NOT "no data". A site-wide utilization call returns every employee's totals with an
          // EMPTY `days` list by design; only a call that names an employee carries the breakdown.
          // Reading this as "nothing was recorded" would be a false report about a row that is
          // sitting right above it showing hours.
          <div className={styles.sectionHint}>
            The day-by-day breakdown comes back only for a query that names one employee. Pick{' '}
            <b>{row.employeeName?.trim() || row.employeeId}</b> in the employee filter above to see
            it — the totals, applications and domains here are for the whole window either way.
          </div>
        ) : (
          <Table<UtilizationDayRow>
            rowKey={(day, index) => day.date || `day-${index ?? 0}`}
            size="small"
            columns={dayColumns}
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

/**
 * Employees offered by the filter, from the rows already on screen plus any attendance already
 * loaded. There is no employee-directory endpoint on this module, and fetching the whole
 * organisation to populate a filter would be a heavier call than the report it narrows. The
 * selected id is always kept in the list so a filter can never silently erase itself.
 */
function employeeOptions(
  rows: EmployeeUtilizationView[],
  names: Array<{ employeeId: string; employeeName?: string }>,
  selected?: string,
): Array<{ value: string; label: string }> {
  const byId = new Map<string, string>();
  const add = (id?: string | null, name?: string | null) => {
    if (!id) return;
    if (!byId.get(id)) byId.set(id, name?.trim() || id);
  };
  (rows ?? []).forEach((row) => add(row.employeeId, row.employeeName));
  (names ?? []).forEach((row) => add(row.employeeId, row.employeeName));
  if (selected && !byId.has(selected)) byId.set(selected, selected);

  return Array.from(byId.entries())
    .map(([value, name]) => ({ value, label: name === value ? value : `${name} (${value})` }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

interface Props {
  section: ReportSectionKey;
  onSectionChange: (section: ReportSectionKey) => void;
  /** Overrides the panel's own loader — a template that wants to drive the fetch itself may pass one. */
  onRefresh?: () => void;
}

/**
 * Reports → Utilization: what each employee's window was spent on.
 *
 * <b>Site-wide and single-employee are two different answers, and the screen says which it has.</b>
 * Without an `employeeId` the backend returns one row per employee with totals, categories, apps,
 * domains and machines — and an EMPTY `days[]`. That empty list is not an absence of data; it is
 * the mode the query asked for. So the table renders every row's numbers regardless, and only the
 * day-by-day section explains itself. The alternative — treating empty `days` as "no data" — would
 * put "nothing recorded" underneath a row that is showing seven hours.
 *
 * <b>This panel owns its own loading and its own last-run verdict.</b> The store keeps one shared
 * `error` and one shared `reportLoading` for three result slots, so a failure raised by the health
 * report would otherwise explain this table, and this table's failure would be wiped by the next
 * report that runs (every loader clears `error` on entry). The panel therefore records the outcome
 * of the runs *it* performed and prefers that over the shared slot.
 */
const UtilizationPanel: React.FC<Props> = ({ section, onSectionChange, onRefresh }) => {
  const query = useHrmWorkforceStore((s) => s.reportQuery);
  const rows = useHrmWorkforceStore((s) => s.utilization);
  const attendance = useHrmWorkforceStore((s) => s.attendance);
  const sharedLoading = useHrmWorkforceStore((s) => s.reportLoading);
  const sharedError = useHrmWorkforceStore((s) => s.error);
  const { loadUtilization } = useHrmWorkforceData();

  const [busy, setBusy] = useState(false);
  // `null` = this panel has not run yet, so the shared error (if any) is the only verdict there is.
  // Once it has run, its own outcome is the truthful one for this table.
  const [lastRun, setLastRun] = useState<{ error: string | null } | null>(null);

  /**
   * Which run is the current one, and which is the newest to have finished.
   *
   * Every picker change fires a run, and two requests in flight can resolve in either order. The
   * token makes the last query ISSUED the one that wins rather than the last to RESOLVE: a run that
   * finds a newer token in the ref when it returns has been superseded and must not speak for the
   * screen — it neither records its verdict nor stops the spinner the newer run is still owed.
   */
  const runToken = useRef(0);
  const settledToken = useRef(0);
  /** Always the current `run`, so the resync below can call it without a circular dependency. */
  const runRef = useRef<(q?: ReportQuery) => Promise<void>>(async () => {});

  const run = useCallback(
    async (q?: ReportQuery) => {
      const token = ++runToken.current;
      setBusy(true);
      try {
        await loadUtilization(q);
      } finally {
        const superseded = token !== runToken.current;
        // Did a NEWER run already finish before this stale one came back? If so its rows were in
        // the store and this one has just overwritten them.
        const newerAlreadySettled = settledToken.current > token;
        if (settledToken.current < token) settledToken.current = token;

        if (!superseded) {
          // Read *after* the load: every loader sets `error` to null on entry, so whatever is in
          // the slot now is this run's own outcome.
          setLastRun({ error: useHrmWorkforceStore.getState().error });
          setBusy(false);
        } else if (newerAlreadySettled) {
          // The rows are now the superseded query's answer — the store write happens inside the
          // hook's loader, which this panel cannot cancel, so discarding the result here is not
          // enough to undo it. Re-ask for the query that is actually in the bar. This can only fire
          // when a slow run outlives a faster newer one, and the run it issues carries a fresh
          // token, so it cannot loop.
          void runRef.current();
        }
        // The remaining case — superseded while the newer run is still in flight — is a plain
        // discard: that run owns the spinner and will write the rows that match the bar.
      }
    },
    [loadUtilization],
  );

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  // First look at this section fetches it. Deliberately self-loading rather than waiting to be
  // driven: the alternative is a parent that loads the three report slots one after another, and
  // because each loader clears `error` on entry, a sequential drive silently erases the first
  // failure. A slot that already holds rows is left alone, so toggling back is instant.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if ((rows?.length ?? 0) === 0) void run();
    // Mount only — a dependency on `rows` would re-fire this on every load it performs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options = useMemo(
    () => employeeOptions(rows, attendance ?? [], query.employeeId),
    [rows, attendance, query.employeeId],
  );

  const [expanded, setExpanded] = useState<React.Key[]>([]);
  // One row is a report about one person, and making them click it open would hide the whole answer
  // behind a chevron. Many rows stay collapsed — that view is a comparison, not a dossier.
  useEffect(() => {
    setExpanded(rows?.length === 1 && rows[0]?.employeeId ? [rows[0].employeeId] : []);
  }, [rows]);

  const apply = (patch: Partial<ReportQuery>) => {
    void run({ ...query, ...patch });
  };

  const loading = busy || sharedLoading;
  const error = lastRun ? lastRun.error : sharedError;

  const columns: ColumnsType<EmployeeUtilizationView> = [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      width: 240,
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
      title: 'Days',
      key: 'days',
      width: 80,
      align: 'right',
      sorter: (a, b) => num(a.totals?.days) - num(b.totals?.days),
      render: (_, row) => <span className={styles.numCell}>{num(row.totals?.days)}</span>,
    },
    {
      title: 'Present',
      key: 'present',
      width: 96,
      align: 'right',
      defaultSortOrder: 'descend',
      sorter: (a, b) => num(a.totals?.presentMinutes) - num(b.totals?.presentMinutes),
      render: (_, row) => <span className={styles.numCell}>{fmtMinutes(num(row.totals?.presentMinutes))}</span>,
    },
    {
      title: 'Active',
      key: 'active',
      width: 96,
      align: 'right',
      sorter: (a, b) => num(a.totals?.activeMinutes) - num(b.totals?.activeMinutes),
      render: (_, row) => <span className={styles.numCell}>{fmtMinutes(num(row.totals?.activeMinutes))}</span>,
    },
    {
      title: 'Idle',
      key: 'idle',
      width: 96,
      align: 'right',
      sorter: (a, b) => num(a.totals?.idleMinutes) - num(b.totals?.idleMinutes),
      render: (_, row) => (
        <span className={`${styles.numCell} ${styles.cellMuted}`}>{fmtMinutes(num(row.totals?.idleMinutes))}</span>
      ),
    },
    {
      title: 'Where',
      key: 'where',
      width: 160,
      render: (_, row) => (
        <WfoWfhBar
          office={row.totals?.officeMinutes}
          home={row.totals?.homeMinutes}
          client={row.totals?.clientMinutes}
          other={row.totals?.otherMinutes}
        />
      ),
    },
    {
      title: 'Apps',
      key: 'apps',
      width: 84,
      align: 'right',
      sorter: (a, b) => (a.appCount ?? 0) - (b.appCount ?? 0),
      render: (_, row) => (
        <span className={`${styles.numCell} ${styles.cellMuted}`}>{row.appCount ?? (row.apps?.length ?? 0)}</span>
      ),
    },
  ];

  const emptyText = (
    <div className={styles.emptyState}>
      <div className={styles.emptyTitle}>No utilization in this window.</div>
      {error ? (
        <div className={styles.emptyError}>The last workforce request failed: {error}</div>
      ) : (
        <div className={styles.emptyHint}>
          No employee has a derived day in this range. Widen the range, clear the employee filter, or
          check that the days have been finalized.
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
        employeeOptions={options}
      />

      {/* The failure is said above the table as well as inside its empty state: a failed refresh
          that left the previous rows on screen has no empty state to speak from. */}
      {error && (rows?.length ?? 0) > 0 ? (
        <div className={styles.repError}>The last workforce request failed: {error}</div>
      ) : null}

      <Table<EmployeeUtilizationView>
        rowKey={(row, index) => row.employeeId || `row-${index ?? 0}`}
        size="small"
        columns={columns}
        dataSource={rows}
        loading={loading}
        locale={{ emptyText }}
        expandable={{
          expandedRowKeys: expanded,
          onExpandedRowsChange: (keys) => setExpanded([...keys]),
          expandedRowRender: (row) => <UtilizationDetail row={row} />,
          // The apps/domains/machines rollups are on every row even when `days` is empty, so every
          // row has something to open.
          rowExpandable: () => true,
        }}
        scroll={{ x: 'max-content' }}
        pagination={{
          defaultPageSize: 10,
          size: 'small',
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (count) => `${count} employee${count === 1 ? '' : 's'}`,
        }}
      />
    </div>
  );
};

export default UtilizationPanel;
