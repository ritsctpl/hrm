'use client';

import { Typography } from 'antd';
import { formatCompWindow } from '../../utils/formatters';

interface CompWindowDisplayProps {
  start?: string;
  end?: string;
}

export default function CompWindowDisplay({ start, end }: CompWindowDisplayProps) {
  if (!start || !end) return null;
  return (
    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
      Comp: {formatCompWindow(start, end)}
    </Typography.Text>
  );
}
