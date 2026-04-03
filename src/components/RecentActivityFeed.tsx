'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { MOCK_RECENT_ACTIVITY } from '@/config/dashboardConfig';
import styles from './RightPanel.module.css';

const STATUS_COLORS: Record<string, string> = {
  success: '#10b981',
  info: '#3b82f6',
  warning: '#f59e0b',
};

const RecentActivityFeed: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div>
      {MOCK_RECENT_ACTIVITY.map((item) => (
        <div key={item.id} className={styles.activityItem}>
          <span className={styles.statusDot} style={{ background: STATUS_COLORS[item.status] }} />
          <div className={styles.activityText}>
            <span>{t(item.descriptionKey)}</span>
            <span className={styles.activityTime}>{item.timeAgo}</span>
          </div>
        </div>
      ))}
      <div
        className={styles.viewAll}
        onClick={() => router.push('/rits/hrm_notification_app')}
      >
        {t('dashboard.viewAll')} →
      </div>
    </div>
  );
};

export default RecentActivityFeed;
