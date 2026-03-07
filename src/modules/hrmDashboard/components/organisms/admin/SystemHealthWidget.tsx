'use client';

import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import SystemStatusDot from '../../atoms/SystemStatusDot';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

export default function SystemHealthWidget() {
  const { systemHealth, loadingAdminData } = useHrmDashboardStore();

  return (
    <WidgetCard title="System Health" loading={loadingAdminData}>
      {!systemHealth ? (
        <div className={styles.emptyState}>Health data unavailable</div>
      ) : (
        <div className={styles.systemHealthGrid}>
          <div className={styles.healthMetric}>
            <span className={styles.healthMetricLabel}>Services</span>
            <div className={styles.healthMetricValue}>
              <SystemStatusDot
                status={
                  systemHealth.servicesHealthy === systemHealth.totalServices
                    ? 'OK'
                    : systemHealth.servicesHealthy >= systemHealth.totalServices * 0.8
                    ? 'WARNING'
                    : 'ERROR'
                }
                size={10}
              />
              {systemHealth.servicesHealthy}/{systemHealth.totalServices}
            </div>
          </div>
          <div className={styles.healthMetric}>
            <span className={styles.healthMetricLabel}>Database</span>
            <div className={styles.healthMetricValue}>
              <SystemStatusDot status={systemHealth.dbStatus} size={10} />
              {systemHealth.dbStatus}
            </div>
          </div>
          <div className={styles.healthMetric}>
            <span className={styles.healthMetricLabel}>API Response</span>
            <div className={styles.healthMetricValue}>
              {systemHealth.apiResponseMs}
              <span style={{ fontSize: 12, fontWeight: 400, color: '#8c8c8c', marginLeft: 2 }}>ms</span>
            </div>
          </div>
          <div className={styles.healthMetric}>
            <span className={styles.healthMetricLabel}>Active Users</span>
            <div className={styles.healthMetricValue}>{systemHealth.activeUsers}</div>
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
