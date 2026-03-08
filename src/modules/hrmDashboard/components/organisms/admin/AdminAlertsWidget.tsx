'use client';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import AlertSeverityDot from '../../atoms/AlertSeverityDot';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

dayjs.extend(relativeTime);

export default function AdminAlertsWidget() {
  const { adminAlerts, loadingAdminData } = useHrmDashboardStore();

  return (
    <WidgetCard title="System Alerts" loading={loadingAdminData}>
      {adminAlerts.length === 0 ? (
        <div className={styles.emptyState}>No system alerts</div>
      ) : (
        adminAlerts.map((alert) => (
          <div key={alert.handle} className={styles.alertRow}>
            <AlertSeverityDot severity={alert.severity} size={8} />
            <span className={styles.alertMessage}>{alert.message}</span>
            <span className={styles.alertTime}>{dayjs(alert.createdDateTime).fromNow()}</span>
          </div>
        ))
      )}
    </WidgetCard>
  );
}
