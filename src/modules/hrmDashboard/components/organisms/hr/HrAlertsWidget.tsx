'use client';

import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import AlertSeverityDot from '../../atoms/AlertSeverityDot';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

export default function HrAlertsWidget() {
  const { hrAlerts, loadingHrData } = useHrmDashboardStore();

  return (
    <WidgetCard title="HR Alerts" loading={loadingHrData}>
      {hrAlerts.length === 0 ? (
        <div className={styles.emptyState}>No active alerts</div>
      ) : (
        hrAlerts.map((alert) => (
          <div key={alert.id} className={styles.alertRow}>
            <AlertSeverityDot severity={alert.severity} size={8} />
            <span className={styles.alertMessage}>{alert.message}</span>
            {alert.count !== undefined && (
              <span className={styles.alertCount}>({alert.count})</span>
            )}
          </div>
        ))
      )}
    </WidgetCard>
  );
}
