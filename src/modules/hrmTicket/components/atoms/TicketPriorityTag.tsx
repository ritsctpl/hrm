'use client';

import React from 'react';
import { Tag } from 'antd';
import type { TicketPriority } from '../../types/domain.types';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../utils/ticketConstants';

interface Props {
  priority?: TicketPriority;
}

const TicketPriorityTag: React.FC<Props> = ({ priority }) => {
  if (!priority) return <span>—</span>;
  return (
    <Tag color={PRIORITY_COLORS[priority]} style={{ marginInlineEnd: 0, fontSize: 12 }}>
      {PRIORITY_LABELS[priority]}
    </Tag>
  );
};

export default TicketPriorityTag;
