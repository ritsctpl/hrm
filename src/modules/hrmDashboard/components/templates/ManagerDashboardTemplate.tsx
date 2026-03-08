'use client';

import TeamOverviewWidget from '../organisms/manager/TeamOverviewWidget';
import PendingApprovalsWidget from '../organisms/manager/PendingApprovalsWidget';
import TeamLeaveCalendarWidget from '../organisms/manager/TeamLeaveCalendarWidget';
import ProfileSummaryWidget from '../organisms/employee/ProfileSummaryWidget';
import AnnouncementsWidget from '../organisms/employee/AnnouncementsWidget';
import styles from '../../styles/Dashboard.module.css';

export default function ManagerDashboardTemplate() {
  return (
    <div className={styles.dashboardContent}>
      <div style={{ marginBottom: 16 }}>
        <ProfileSummaryWidget />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <TeamOverviewWidget />
        <PendingApprovalsWidget />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <TeamLeaveCalendarWidget />
        <AnnouncementsWidget />
      </div>
    </div>
  );
}
