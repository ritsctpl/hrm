'use client';

import { Typography } from 'antd';
import { formatDateTime } from '../../utils/formatters';
import type { HolidayAuditLog } from '../../types/domain.types';

interface AuditLogRowProps {
  log: HolidayAuditLog;
}

export default function AuditLogRow({ log }: AuditLogRowProps) {
  return (
    <div>
      <Typography.Text strong>{log.action}</Typography.Text>
      {log.comment && (
        <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
          {log.comment}
        </Typography.Text>
      )}
      <div>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {log.performedBy} ({log.performedByRole}) · {formatDateTime(log.performedAt)}
        </Typography.Text>
      </div>
    </div>
  );
}
