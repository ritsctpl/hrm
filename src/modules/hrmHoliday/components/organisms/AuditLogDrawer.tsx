'use client';

import { useEffect } from 'react';
import { Timeline, Spin, Empty, Typography } from 'antd';
import AuditLogRow from '../molecules/AuditLogRow';
import { useHrmHolidayStore } from '../../stores/hrmHolidayStore';
import { useHolidayDetail } from '../../hooks/useHolidayDetail';
import type { AuditLogDrawerProps } from '../../types/ui.types';
import styles from '../../styles/HolidayDetail.module.css';

export default function AuditLogDrawer({ groupHandle, organizationId }: AuditLogDrawerProps) {
  const { auditLogs, auditLogsLoading } = useHrmHolidayStore();
  const { loadAuditLogs } = useHolidayDetail(organizationId, groupHandle);

  useEffect(() => {
    loadAuditLogs();
  }, [groupHandle]);

  if (auditLogsLoading) {
    return (
      <div className={styles.spinWrapper}>
        <Spin tip="Loading audit log..." />
      </div>
    );
  }

  if (auditLogs.length === 0) {
    return <Empty description="No audit entries found" style={{ marginTop: 32 }} />;
  }

  return (
    <div className={styles.auditWrapper}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {auditLogs.length} entries
      </Typography.Text>
      <Timeline
        style={{ marginTop: 16 }}
        items={auditLogs.map((log) => ({
          key: log.handle,
          children: <AuditLogRow log={log} />,
          color: log.action.includes('LOCK') ? 'red' : log.action.includes('PUBLISH') ? 'green' : 'blue',
        }))}
      />
    </div>
  );
}
