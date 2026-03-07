'use client';

import { useEffect } from 'react';
import ProfileSummaryWidget from '../organisms/employee/ProfileSummaryWidget';
import LeaveBalanceWidget from '../organisms/employee/LeaveBalanceWidget';
import PendingRequestsWidget from '../organisms/employee/PendingRequestsWidget';
import RecentPayslipsWidget from '../organisms/employee/RecentPayslipsWidget';
import MyGoalsWidget from '../organisms/employee/MyGoalsWidget';
import UpcomingHolidaysWidget from '../organisms/employee/UpcomingHolidaysWidget';
import AnnouncementsWidget from '../organisms/employee/AnnouncementsWidget';
import { useEmployeeWidgets } from '../../hooks/useEmployeeWidgets';
import styles from '../../styles/Dashboard.module.css';

export default function EmployeeDashboardTemplate() {
  const { loadEmployeeData } = useEmployeeWidgets();

  useEffect(() => {
    loadEmployeeData();
  }, [loadEmployeeData]);

  return (
    <div className={styles.dashboardContent}>
      <div style={{ marginBottom: 16 }}>
        <ProfileSummaryWidget />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <LeaveBalanceWidget />
        <PendingRequestsWidget />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <MyGoalsWidget />
        <RecentPayslipsWidget />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <UpcomingHolidaysWidget />
        <AnnouncementsWidget />
      </div>
    </div>
  );
}
