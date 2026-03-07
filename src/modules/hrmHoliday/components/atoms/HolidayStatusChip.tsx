'use client';

import { Tag } from 'antd';
import type { HolidayStatusChipProps } from '../../types/ui.types';

const STATUS_CONFIG = {
  DRAFT: { color: 'default', label: 'Draft' },
  PUBLISHED: { color: 'success', label: 'Published' },
  LOCKED: { color: 'processing', label: 'Locked' },
} as const;

export default function HolidayStatusChip({ status }: HolidayStatusChipProps) {
  const config = STATUS_CONFIG[status] ?? { color: 'default', label: status };
  return (
    <Tag color={config.color} style={{ fontWeight: 600, fontSize: 12 }}>
      {config.label}
    </Tag>
  );
}
