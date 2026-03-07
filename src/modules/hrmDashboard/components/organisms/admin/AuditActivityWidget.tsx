'use client';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

dayjs.extend(relativeTime);

export default function AuditActivityWidget() {
  const { auditActivity, loadingAdminData } = useHrmDashboardStore();

  return (
    <WidgetCard title="Recent Audit Activity" loading={loadingAdminData}>
      {auditActivity.length === 0 ? (
        <div className={styles.emptyState}>No audit activity</div>
      ) : (
        auditActivity.map((item, i) => (
          <div key={i} className={styles.auditRow}>
            <span className={styles.auditTime}>{dayjs(item.time).fromNow()}</span>
            <span className={styles.auditUser}>{item.user}</span>
            <span className={styles.auditAction}>{item.action}</span>
            <span className={styles.auditModule}>{item.module}</span>
          </div>
        ))
      )}
    </WidgetCard>
  );
}
