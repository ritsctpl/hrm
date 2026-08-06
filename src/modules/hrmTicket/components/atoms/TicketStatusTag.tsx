'use client';

import React from 'react';
import { Tag } from 'antd';
import type { TicketStatus } from '../../types/domain.types';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/ticketConstants';

interface Props {
  status?: TicketStatus;
  size?: 'small' | 'default';
}

const TicketStatusTag: React.FC<Props> = ({ status, size = 'default' }) => {
  if (!status) return <span>—</span>;
  return (
    <Tag
      color={STATUS_COLORS[status]}
      style={{
        marginInlineEnd: 0,
        fontSize: size === 'small' ? 11 : 12,
        lineHeight: size === 'small' ? '18px' : '20px',
      }}
    >
      {STATUS_LABELS[status]}
    </Tag>
  );
};

export default TicketStatusTag;
