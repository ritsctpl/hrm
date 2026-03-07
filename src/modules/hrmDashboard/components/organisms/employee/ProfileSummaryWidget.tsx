'use client';

import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import WelcomeBanner from '../../molecules/WelcomeBanner';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

export default function ProfileSummaryWidget() {
  const { employeeProfile, loadingProfile } = useHrmDashboardStore();

  return (
    <WidgetCard title="My Profile" loading={loadingProfile}>
      {employeeProfile ? (
        <WelcomeBanner profile={employeeProfile} />
      ) : (
        <div className={styles.emptyState}>Profile unavailable</div>
      )}
    </WidgetCard>
  );
}
