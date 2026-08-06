'use client';

import React from 'react';
import { Tooltip } from 'antd';
import { ClockCircleOutlined, PauseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { formatDateTime, formatSlaRemaining, isSlaUrgent } from '../../utils/ticketHelpers';

interface Props {
  minutesRemaining?: number | null;
  dueAt?: string;
  breached?: boolean;
  paused?: boolean;
}

/**
 * The SLA countdown.
 *
 * Renders nothing when the backend sends no remaining figure — that means either the category
 * sets no target or the ticket is finished, and in both cases a countdown would be a lie. A
 * breached ticket still shows its overdue amount, because "how late" is the number a lead acts on.
 */
const SlaBadge: React.FC<Props> = ({ minutesRemaining, dueAt, breached, paused }) => {
  const text = formatSlaRemaining(minutesRemaining);

  if (paused) {
    return (
      <Tooltip title="The SLA clock is stopped while this ticket is on hold or awaiting the requester">
        <span style={{ color: '#8c8c8c', fontSize: 12, whiteSpace: 'nowrap' }}>
          <PauseCircleOutlined style={{ marginRight: 4 }} />
          Paused
        </span>
      </Tooltip>
    );
  }

  if (!text) {
    return breached ? (
      <span style={{ color: '#cf1322', fontSize: 12, whiteSpace: 'nowrap' }}>
        <WarningOutlined style={{ marginRight: 4 }} />
        SLA missed
      </span>
    ) : (
      <span style={{ color: '#bfbfbf', fontSize: 12 }}>—</span>
    );
  }

  const overdue = (minutesRemaining ?? 0) < 0 || breached;
  const urgent = isSlaUrgent(minutesRemaining);
  const color = overdue ? '#cf1322' : urgent ? '#d46b08' : '#595959';

  return (
    <Tooltip title={dueAt ? `Due ${formatDateTime(dueAt)}` : undefined}>
      <span style={{ color, fontSize: 12, whiteSpace: 'nowrap', fontWeight: overdue ? 600 : 400 }}>
        {overdue ? (
          <WarningOutlined style={{ marginRight: 4 }} />
        ) : (
          <ClockCircleOutlined style={{ marginRight: 4 }} />
        )}
        {text}
      </span>
    </Tooltip>
  );
};

export default SlaBadge;
