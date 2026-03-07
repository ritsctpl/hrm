'use client';

import { Button } from 'antd';
import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import AnnouncementAlertItem from '../../molecules/AnnouncementAlertItem';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

export default function AnnouncementsWidget() {
  const { announcementAlerts, loadingAnnouncements } = useHrmDashboardStore();

  return (
    <WidgetCard
      title="Announcements"
      loading={loadingAnnouncements}
      footerAction={
        <Button type="link" size="small" style={{ padding: 0 }}>
          View All
        </Button>
      }
    >
      {announcementAlerts.length === 0 ? (
        <div className={styles.emptyState}>No announcements</div>
      ) : (
        announcementAlerts.map((a) => (
          <AnnouncementAlertItem key={a.id} item={a} />
        ))
      )}
    </WidgetCard>
  );
}
