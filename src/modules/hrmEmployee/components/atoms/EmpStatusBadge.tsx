/**
 * EmpStatusBadge - Atom component for displaying employee status
 */

'use client';

import React from 'react';
import { Tag } from 'antd';
import { STATUS_LABELS, STATUS_COLORS } from '../../utils/constants';
import type { EmpStatusBadgeProps } from '../../types/ui.types';

const EmpStatusBadge: React.FC<EmpStatusBadgeProps> = ({ status, size = 'default' }) => {
  const color = STATUS_COLORS[status] || 'default';
  const label = STATUS_LABELS[status] || status;

  return (
    <Tag
      color={color}
      style={{
        borderRadius: 12,
        fontSize: size === 'small' ? 10 : 12,
        padding: size === 'small' ? '0 6px' : '2px 10px',
        lineHeight: size === 'small' ? '18px' : '22px',
        margin: 0,
      }}
    >
      {label}
    </Tag>
  );
};

export default EmpStatusBadge;
