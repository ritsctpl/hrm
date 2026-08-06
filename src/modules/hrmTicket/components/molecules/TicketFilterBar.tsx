'use client';

import React from 'react';
import { Button, Checkbox, Input, Select, Space, Tooltip } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { TicketCategory } from '../../types/domain.types';
import type { TicketFilterState } from '../../types/ui.types';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../../utils/ticketConstants';
import { flattenCategoryOptions } from '../../utils/ticketHelpers';

interface Props {
  filter: TicketFilterState;
  categories: TicketCategory[];
  onChange: (patch: Partial<TicketFilterState>) => void;
  onReload: () => void;
  /** Queue-only toggles — a requester has no use for "unassigned" or "breached". */
  showAgentFilters?: boolean;
  extra?: React.ReactNode;
}

const TicketFilterBar: React.FC<Props> = ({
  filter,
  categories,
  onChange,
  onReload,
  showAgentFilters = false,
  extra,
}) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
      padding: '10px 16px',
      borderBottom: '1px solid #f0f0f0',
      background: '#fff',
    }}
  >
    <Input
      allowClear
      size="small"
      prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
      placeholder="Search number, subject or requester"
      value={filter.searchText}
      onChange={(e) => onChange({ searchText: e.target.value })}
      style={{ width: 260 }}
    />

    <Select
      mode="multiple"
      allowClear
      size="small"
      maxTagCount="responsive"
      placeholder="Status"
      value={filter.statuses}
      onChange={(statuses) => onChange({ statuses })}
      options={STATUS_OPTIONS}
      style={{ minWidth: 160 }}
    />

    <Select
      mode="multiple"
      allowClear
      size="small"
      maxTagCount="responsive"
      placeholder="Priority"
      value={filter.priorities}
      onChange={(priorities) => onChange({ priorities })}
      options={PRIORITY_OPTIONS}
      style={{ minWidth: 140 }}
    />

    <Select
      mode="multiple"
      allowClear
      size="small"
      maxTagCount="responsive"
      placeholder="Category"
      value={filter.categoryCodes}
      onChange={(categoryCodes) => onChange({ categoryCodes })}
      options={flattenCategoryOptions(categories)}
      style={{ minWidth: 180 }}
    />

    {showAgentFilters ? (
      <>
        <Tooltip title="Tickets nobody has picked up yet">
          <Checkbox
            checked={filter.unassignedOnly}
            onChange={(e) => onChange({ unassignedOnly: e.target.checked })}
          >
            <span style={{ fontSize: 12 }}>Unassigned</span>
          </Checkbox>
        </Tooltip>
        <Tooltip title="Past a first-response or resolution target">
          <Checkbox
            checked={filter.slaBreachedOnly}
            onChange={(e) => onChange({ slaBreachedOnly: e.target.checked })}
          >
            <span style={{ fontSize: 12 }}>SLA breached</span>
          </Checkbox>
        </Tooltip>
      </>
    ) : null}

    {/* Hidden while an explicit status filter is set — the two would intersect, and a user who
        picked "Closed" would get an empty table with no indication why. */}
    {filter.statuses.length === 0 ? (
      <Checkbox
        checked={filter.openOnly}
        onChange={(e) => onChange({ openOnly: e.target.checked })}
      >
        <span style={{ fontSize: 12 }}>Open only</span>
      </Checkbox>
    ) : null}

    <Space size={8} style={{ marginLeft: 'auto' }}>
      {extra}
      <Tooltip title="Reload">
        <Button size="small" icon={<ReloadOutlined />} onClick={onReload} />
      </Tooltip>
    </Space>
  </div>
);

export default TicketFilterBar;
