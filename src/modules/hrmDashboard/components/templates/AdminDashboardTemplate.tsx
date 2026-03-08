'use client';

import SystemHealthWidget from '../organisms/admin/SystemHealthWidget';
import ModuleUsageWidget from '../organisms/admin/ModuleUsageWidget';
import AuditActivityWidget from '../organisms/admin/AuditActivityWidget';
import AdminAlertsWidget from '../organisms/admin/AdminAlertsWidget';
import styles from '../../styles/Dashboard.module.css';

export default function AdminDashboardTemplate() {
  return (
    <div className={styles.dashboardContent}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <SystemHealthWidget />
        <AdminAlertsWidget />
      </div>
      <div style={{ marginBottom: 16 }}>
        <ModuleUsageWidget />
      </div>
      <div>
        <AuditActivityWidget />
      </div>
    </div>
  );
}
