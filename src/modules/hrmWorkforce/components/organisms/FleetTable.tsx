'use client';

import React, { useMemo, useState } from 'react';
import { Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import LivenessChip from '../atoms/LivenessChip';
import AttributionTag from '../atoms/AttributionTag';
import FleetFilterBar from '../molecules/FleetFilterBar';
import { filterFleet, useHrmWorkforceData } from '../../hooks/useHrmWorkforceData';
import { useHrmWorkforceStore } from '../../stores/hrmWorkforceStore';
import type { FleetDeviceView } from '../../types/domain.types';
import type { FleetFilter } from '../../types/ui.types';
import { fromNowSafe } from '../../utils/workforceFormat';
import styles from '../../styles/Workforce.module.css';

interface FleetCounts {
  total: number;
  online: number;
  delayed: number;
  stale: number;
  offline: number;
  attributed: number;
  unattributed: number;
}

const EMPTY_COUNTS: FleetCounts = {
  total: 0,
  online: 0,
  delayed: 0,
  stale: 0,
  offline: 0,
  attributed: 0,
  unattributed: 0,
};

/**
 * Counts off the FULL list — see `.fleetSummary` in the stylesheet for why they never follow the
 * filter. Every liveness state is counted, not just the three the summary was first sketched with:
 * a row of counts that does not add up to the total reads as a rendering bug, and DELAYED is a real
 * state a device passes through on its way to STALE.
 */
function countFleet(rows: FleetDeviceView[]): FleetCounts {
  return (rows ?? []).reduce<FleetCounts>(
    (acc, row) => {
      acc.total += 1;
      if (row.liveness === 'ONLINE') acc.online += 1;
      else if (row.liveness === 'DELAYED') acc.delayed += 1;
      else if (row.liveness === 'STALE') acc.stale += 1;
      else if (row.liveness === 'OFFLINE') acc.offline += 1;
      // An unknown/absent liveness still counts toward the total: it is a machine on the estate.
      if (row.attributedEmployeeId && row.attributedEmployeeId.trim()) acc.attributed += 1;
      else acc.unattributed += 1;
      return acc;
    },
    { ...EMPTY_COUNTS },
  );
}

/**
 * A device that has never heartbeated has no instant to compare, so it is ranked below every real
 * one: under the column's default (descending) order that puts the never-seen machines at the
 * bottom and the freshest at the top, which is the reading the tab is for. Ascending flips them to
 * the top, deliberately — "show me the ones we have not heard from" is the other half of the same
 * question.
 */
const byLastSeen = (a: FleetDeviceView, b: FleetDeviceView): number => {
  const ta = a.lastSeenAt ? dayjs(a.lastSeenAt).valueOf() : Number.NEGATIVE_INFINITY;
  const tb = b.lastSeenAt ? dayjs(b.lastSeenAt).valueOf() : Number.NEGATIVE_INFINITY;
  return ta - tb;
};

const SUMMARY_ITEMS: Array<{ key: keyof FleetCounts; label: string; cls?: string }> = [
  { key: 'total', label: 'Devices' },
  { key: 'online', label: 'Online', cls: 'countOn' },
  { key: 'delayed', label: 'Delayed' },
  { key: 'stale', label: 'Stale' },
  { key: 'offline', label: 'Offline', cls: 'countOff' },
  { key: 'attributed', label: 'Attributed' },
  { key: 'unattributed', label: 'Unattributed', cls: 'countGap' },
];

interface Props {
  /** Defaults to the hook's `refreshFleet`; overridable so a template can refresh several slots at once. */
  onRefresh?: () => void;
}

/**
 * The Fleet tab: every machine enrolled at the site, what it is, whether it is talking, and whose
 * attendance its hours land on.
 *
 * <b>Filtering is local state, counting is not.</b> The search and liveness filters live in this
 * component's `useState` and are applied with the tested pure `filterFleet`; the summary is reduced
 * over the unfiltered store list, so narrowing the table never rewrites the estate's headline
 * numbers underneath it.
 *
 * <b>Empty is three different findings.</b> "No devices enrolled yet" (nothing has ever checked in),
 * "no devices match this filter" (the operator narrowed it themselves) and "the last request
 * failed" all render an empty table otherwise, and they call for opposite responses — so the empty
 * state says which one it is, and surfaces the store's durable error for an operator who missed the
 * toast. The error line is worded for the store's single shared `error` slot: it names the last
 * failed workforce request rather than claiming the fleet load specifically failed.
 *
 * <b>Revoked devices stay listed.</b> The registry's own status is a different question from
 * liveness, and a revoked machine that is still heartbeating is the row most worth seeing — it is
 * dimmed and tagged, never filtered out.
 */
const FleetTable: React.FC<Props> = ({ onRefresh }) => {
  const fleet = useHrmWorkforceStore((s) => s.fleet);
  const loading = useHrmWorkforceStore((s) => s.fleetLoading);
  const error = useHrmWorkforceStore((s) => s.error);
  const { refreshFleet } = useHrmWorkforceData();

  const [filter, setFilter] = useState<FleetFilter>({ search: '', liveness: [] });
  const onChange = (patch: Partial<FleetFilter>) => setFilter((prev) => ({ ...prev, ...patch }));

  const counts = useMemo(() => countFleet(fleet), [fleet]);
  const rows = useMemo(() => filterFleet(fleet, filter), [fleet, filter]);

  const columns: ColumnsType<FleetDeviceView> = [
    {
      title: 'Device',
      dataIndex: 'hostname',
      width: 240,
      ellipsis: true,
      sorter: (a, b) => (a.hostname ?? '').localeCompare(b.hostname ?? ''),
      render: (_, row) => (
        <div style={{ minWidth: 0 }}>
          <div className={styles.cellPrimary}>
            {row.hostname || '—'}{' '}
            {row.status && row.status !== 'ACTIVE' ? (
              <Tooltip title="Enrolment revoked — this device should no longer be reporting">
                <Tag color="red" style={{ marginInlineEnd: 0 }}>
                  Revoked
                </Tag>
              </Tooltip>
            ) : null}
          </div>
          {/* The design doc's "OS" sub-line has no field on the wire — `/workforce/fleet/list`
              returns no OS — so the sub-line carries the registry id, which is what an admin
              needs to look the device up. */}
          <div className={`${styles.cellSub} ${styles.mono}`}>{row.deviceId || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Serial',
      dataIndex: 'serialNumber',
      width: 150,
      render: (value: string) => <span className={styles.mono}>{value || '—'}</span>,
    },
    {
      title: 'Model',
      dataIndex: 'model',
      width: 190,
      ellipsis: true,
      render: (value: string) =>
        value ? <span>{value}</span> : <span className={styles.cellMuted}>—</span>,
    },
    {
      title: 'Agent',
      dataIndex: 'agentVersion',
      width: 110,
      render: (value: string) =>
        value ? (
          <span className={styles.mono}>{value}</span>
        ) : (
          <span className={styles.cellMuted}>—</span>
        ),
    },
    {
      title: 'Liveness',
      dataIndex: 'liveness',
      width: 130,
      render: (_, row) => <LivenessChip liveness={row.liveness} lastSeenAt={row.lastSeenAt} />,
    },
    {
      title: 'Attributed to',
      dataIndex: 'attributedEmployeeId',
      width: 180,
      // The fleet row carries the employee id and no name (backend ruling), so the code is what
      // renders; `AttributionTag` turns the null into the amber gap rather than an em dash.
      render: (_, row) => <AttributionTag employeeCode={row.attributedEmployeeId} />,
    },
    {
      title: 'Last seen',
      dataIndex: 'lastSeenAt',
      width: 150,
      defaultSortOrder: 'descend',
      sorter: byLastSeen,
      render: (value: string | null) => {
        const d = value ? dayjs(value) : null;
        const cell = (
          <span className={value ? undefined : styles.cellMuted}>{fromNowSafe(value)}</span>
        );
        return d && d.isValid() ? (
          <Tooltip title={d.format('DD MMM YYYY HH:mm')}>{cell}</Tooltip>
        ) : (
          <Tooltip title="This device has never heartbeated">{cell}</Tooltip>
        );
      },
    },
  ];

  const emptyText = (
    <div className={styles.emptyState}>
      <div className={styles.emptyTitle}>
        {fleet.length === 0 ? 'No devices enrolled yet.' : 'No devices match this filter.'}
      </div>
      {fleet.length === 0 ? (
        error ? (
          <div className={styles.emptyError}>The last workforce request failed: {error}</div>
        ) : (
          <div className={styles.emptyHint}>
            A machine appears here the first time its agent checks in.
          </div>
        )
      ) : (
        <div className={styles.emptyHint}>
          {counts.total} device{counts.total === 1 ? '' : 's'} enrolled — clear the search or the
          liveness filter to see them.
        </div>
      )}
    </div>
  );

  return (
    <div>
      <FleetFilterBar
        filter={filter}
        onChange={onChange}
        onRefresh={onRefresh ?? refreshFleet}
        loading={loading}
      />

      <div className={styles.fleetSummary}>
        {SUMMARY_ITEMS.map((item) => (
          <span key={item.key} className={styles.fleetCount}>
            <span className={`${styles.fleetCountValue} ${(item.cls && styles[item.cls]) || ''}`}>
              {counts[item.key]}
            </span>
            <span className={styles.fleetCountLabel}>{item.label}</span>
          </span>
        ))}
      </div>

      <Table<FleetDeviceView>
        rowKey={(row) => row.deviceId || row.serialNumber}
        size="small"
        columns={columns}
        dataSource={rows}
        loading={loading}
        locale={{ emptyText }}
        scroll={{ x: 'max-content', y: 'calc(100vh - 360px)' }}
        rowClassName={(row) => (row.status && row.status !== 'ACTIVE' ? styles.rowRevoked : '')}
        pagination={{
          defaultPageSize: 20,
          size: 'small',
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (count) => `${count} device${count === 1 ? '' : 's'}`,
        }}
      />
    </div>
  );
};

export default FleetTable;
