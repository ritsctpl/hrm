'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import QuickTasksList from './QuickTasksList';
import RecentActivityFeed from './RecentActivityFeed';
import styles from './RightPanel.module.css';

const RightPanel: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.rightPanel}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('dashboard.quickTasks')}</h3>
        <QuickTasksList />
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('dashboard.recentActivity')}</h3>
        <RecentActivityFeed />
      </div>
    </div>
  );
};

export default RightPanel;
