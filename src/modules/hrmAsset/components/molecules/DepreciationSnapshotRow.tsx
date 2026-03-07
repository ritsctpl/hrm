'use client';

import { Typography } from 'antd';
import { formatDate, formatCurrency } from '../../utils/assetHelpers';
import type { DepreciationSnapshotRowProps } from '../../types/ui.types';

export default function DepreciationSnapshotRow({ snapshot }: DepreciationSnapshotRowProps) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <Typography.Text style={{ minWidth: 100 }}>{formatDate(snapshot.asOfDate)}</Typography.Text>
      <Typography.Text style={{ minWidth: 110 }}>{formatCurrency(snapshot.prevBookValueINR)}</Typography.Text>
      <Typography.Text style={{ minWidth: 60 }}>{snapshot.ratePct}%</Typography.Text>
      <Typography.Text strong style={{ minWidth: 110 }}>{formatCurrency(snapshot.presentValueINR)}</Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: 11 }}>{snapshot.runBy}</Typography.Text>
    </div>
  );
}
