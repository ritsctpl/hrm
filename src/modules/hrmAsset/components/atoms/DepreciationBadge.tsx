'use client';

import { Typography } from 'antd';
import { formatCurrency } from '../../utils/assetHelpers';

interface DepreciationBadgeProps {
  presentValueINR: number;
  purchaseValueINR: number;
}

export default function DepreciationBadge({ presentValueINR, purchaseValueINR }: DepreciationBadgeProps) {
  const pct = purchaseValueINR > 0 ? Math.round((presentValueINR / purchaseValueINR) * 100) : 100;
  const color = pct > 60 ? '#52c41a' : pct > 30 ? '#faad14' : '#ff4d4f';
  return (
    <span>
      <Typography.Text strong style={{ color }}>{formatCurrency(presentValueINR)}</Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>({pct}%)</Typography.Text>
    </span>
  );
}
