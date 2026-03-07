'use client';

import React from 'react';
import { Tag } from 'antd';
import { HRM_STATUS_COLORS } from '../constants/statusColors';
import styles from '../styles/HrmShared.module.css';

interface HrmStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

/**
 * HrmStatusBadge
 *
 * Renders an Ant Design Tag whose color is resolved from the
 * HRM_STATUS_COLORS map. Unknown statuses fall back to 'default'.
 *
 * @param status - The workflow status key (e.g. "APPROVED", "REJECTED")
 * @param size   - 'sm' renders a smaller tag, 'md' is the default
 */
const HrmStatusBadge: React.FC<HrmStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const normalised = status.toUpperCase().replace(/\s+/g, '_');
  const color = HRM_STATUS_COLORS[normalised] ?? 'default';

  const displayLabel = status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Tag
      color={color}
      className={size === 'sm' ? styles.statusBadgeSm : undefined}
    >
      {displayLabel}
    </Tag>
  );
};

export default HrmStatusBadge;
