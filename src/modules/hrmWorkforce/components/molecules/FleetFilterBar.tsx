'use client';

import React from 'react';
import { Button, Input, Select, Tooltip } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { Liveness } from '../../types/domain.types';
import type { FleetFilter } from '../../types/ui.types';
import { LIVENESS_META } from '../../utils/workforceConstants';
import styles from '../../styles/Workforce.module.css';

/**
 * Worst-first, not alphabetical: the four states are a condition ladder, and a picker that reads
 * DELAYED / OFFLINE / ONLINE / STALE makes the operator re-derive the ordering every time.
 * Declared as a typed tuple rather than `Object.keys(LIVENESS_META)` so the values stay `Liveness`
 * (the meta map is keyed by `string` to survive an unknown value from the backend) and so an added
 * key in the meta map cannot silently change what the filter offers.
 */
const LIVENESS_ORDER: Liveness[] = ['ONLINE', 'DELAYED', 'STALE', 'OFFLINE'];

const LIVENESS_OPTIONS = LIVENESS_ORDER.map((value) => ({
  value,
  label: LIVENESS_META[value]?.label ?? value,
}));

interface Props {
  filter: FleetFilter;
  /** A patch, not a replacement — the two controls must not have to re-send each other's value. */
  onChange: (patch: Partial<FleetFilter>) => void;
  onRefresh: () => void;
  loading?: boolean;
  /** Rendered left of Refresh — the tab's own actions, if it has any. */
  extra?: React.ReactNode;
}

/**
 * The Fleet tab's filter bar: a search box, a liveness multi-select and Refresh.
 *
 * <b>Both filters are client-side.</b> `/workforce/fleet/list` takes no search or liveness
 * parameter — it answers with the site's enrolled machines, a few hundred rows at most — so
 * filtering here is a substring test over data already in hand. Refresh is the only control that
 * touches the network, and it is deliberately separate: an operator watching a machine come back
 * up needs to re-ask the server, and a search box that silently re-fetched would make "no results"
 * and "the request failed" look the same.
 *
 * <b>An empty liveness selection means every liveness.</b> A just-cleared multi-select and a
 * deliberate "show nothing" are indistinguishable on screen, and only one of them is a usable
 * table; `filterFleet` reads the empty array the same way.
 *
 * Stateless on purpose — `FleetTable` owns the filter so that the table's own summary counts can
 * be computed off the unfiltered list.
 */
const FleetFilterBar: React.FC<Props> = ({ filter, onChange, onRefresh, loading, extra }) => (
  <div className={styles.fleetBar}>
    <Input
      allowClear
      size="small"
      prefix={<SearchOutlined className={styles.cellMuted} />}
      placeholder="Search hostname, serial or employee"
      value={filter.search}
      onChange={(e) => onChange({ search: e.target.value })}
      style={{ width: 280 }}
    />

    <Select<Liveness[]>
      mode="multiple"
      allowClear
      size="small"
      maxTagCount="responsive"
      placeholder="Liveness"
      value={filter.liveness}
      onChange={(liveness) => onChange({ liveness })}
      options={LIVENESS_OPTIONS}
      style={{ minWidth: 190 }}
    />

    <div className={styles.fleetBarRight}>
      {extra}
      <Tooltip title="Re-ask the server for the fleet">
        <Button size="small" icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>
          Refresh
        </Button>
      </Tooltip>
    </div>
  </div>
);

export default FleetFilterBar;
