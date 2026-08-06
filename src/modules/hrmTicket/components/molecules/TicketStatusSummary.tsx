'use client';

import React from 'react';
import { Tag } from 'antd';
import type { TicketStatus } from '../../types/domain.types';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/ticketConstants';

interface Props {
  counts: Record<string, number>;
  breachedCount?: number;
  activeStatuses: TicketStatus[];
  onToggle: (status: TicketStatus) => void;
}

/**
 * Clickable status counts above the table.
 *
 * The counts come back with the page, computed against the same filter minus the status criterion
 * — so selecting "Open" does not report every other chip as zero, which is what a naive
 * count-the-current-page implementation does.
 */
const TicketStatusSummary: React.FC<Props> = ({
  counts,
  breachedCount,
  activeStatuses,
  onToggle,
}) => {
  const entries = Object.entries(counts).filter(([, count]) => count > 0);
  if (entries.length === 0 && !breachedCount) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        padding: '8px 16px',
        borderBottom: '1px solid #f5f5f5',
        background: '#fafafa',
      }}
    >
      {entries.map(([status, count]) => {
        const key = status as TicketStatus;
        const active = activeStatuses.includes(key);
        return (
          <Tag
            key={status}
            color={active ? STATUS_COLORS[key] : undefined}
            onClick={() => onToggle(key)}
            style={{
              cursor: 'pointer',
              margin: 0,
              borderStyle: active ? 'solid' : 'dashed',
            }}
          >
            {STATUS_LABELS[key] ?? status} · {count}
          </Tag>
        );
      })}
      {breachedCount ? (
        <Tag color="red" style={{ margin: 0 }}>
          SLA breached · {breachedCount}
        </Tag>
      ) : null}
    </div>
  );
};

export default TicketStatusSummary;
