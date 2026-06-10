'use client';

import { Typography } from 'antd';
import { formatCurrency } from '../../utils/assetHelpers';

interface DepreciationBadgeProps {
  presentValueINR: number;
  purchaseValueINR: number;
  /**
   * When false, the monetary amount is hidden and only the depreciation
   * percentage is shown. Used in the asset listing screen, where asset
   * value must not be displayed (it remains on the detail page).
   */
  showAmount?: boolean;
}

export default function DepreciationBadge({ presentValueINR, purchaseValueINR, showAmount = true }: DepreciationBadgeProps) {
  const pct = purchaseValueINR > 0 ? Math.round((presentValueINR / purchaseValueINR) * 100) : 100;
  const color = pct > 60 ? '#52c41a' : pct > 30 ? '#faad14' : '#ff4d4f';
  if (!showAmount) {
    // Non-monetary indicator only — depreciation % (asset value hidden).
    return (
      <Typography.Text strong style={{ color, fontSize: 11 }}>{pct}%</Typography.Text>
    );
  }
  return (
    <span>
      <Typography.Text strong style={{ color }}>{formatCurrency(presentValueINR)}</Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>({pct}%)</Typography.Text>
    </span>
  );
}
