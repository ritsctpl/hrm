'use client';

import { Tag, Typography } from 'antd';
import { formatDate } from '../../utils/assetHelpers';
import type { CustodyHistoryRowProps } from '../../types/ui.types';

export default function CustodyHistoryRow({ custody }: CustodyHistoryRowProps) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <Typography.Text style={{ minWidth: 80 }}>{custody.custodyId}</Typography.Text>
      <Typography.Text style={{ minWidth: 140 }}>{custody.employeeName}</Typography.Text>
      <Typography.Text type="secondary" style={{ minWidth: 100 }}>{formatDate(custody.fromDate)}</Typography.Text>
      <Typography.Text type="secondary" style={{ minWidth: 100 }}>
        {custody.toDate ? formatDate(custody.toDate) : <Tag color="green">Active</Tag>}
      </Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
        {custody.allocationRequestId ?? '—'}
      </Typography.Text>
    </div>
  );
}
