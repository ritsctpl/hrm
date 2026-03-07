'use client';

import { Tag, Typography } from 'antd';
import { formatDate, formatCurrency } from '../../utils/assetHelpers';
import type { MaintenanceEventRowProps } from '../../types/ui.types';

export default function MaintenanceEventRow({ event }: MaintenanceEventRowProps) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography.Text style={{ minWidth: 90 }}>{formatDate(event.maintenanceDate)}</Typography.Text>
        <Typography.Text type="secondary" style={{ minWidth: 100 }}>{event.vendor ?? '—'}</Typography.Text>
        <Typography.Text style={{ flex: 1 }}>{event.issue}</Typography.Text>
        <Typography.Text>{event.costINR != null ? formatCurrency(event.costINR) : '—'}</Typography.Text>
        {event.warrantyUsed && <Tag color="blue">Warranty</Tag>}
      </div>
      {event.actionTaken && (
        <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>
          Action: {event.actionTaken}
        </Typography.Text>
      )}
    </div>
  );
}
