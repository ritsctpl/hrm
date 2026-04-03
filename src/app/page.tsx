'use client';

import '@/utils/i18n';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import CommonAppBar from '../components/CommonAppBar';
import Tile from '../components/Tile';
import RightPanel from '../components/RightPanel';
import Breadcrumbs from '../components/Breadcrumbs';
import { CENTER_GRID_GROUPS, MOCK_BADGE_COUNTS } from '@/config/dashboardConfig';
import { getModuleIcon } from '@utils/moduleIconMap';
import styles from './HomePage.module.css';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [site, setSite] = useState<string | null>(null);

  return (
    <div>
      <CommonAppBar
        appTitle="Fenta HRM"
        site={site}
        onSiteChange={(newSite: string) => setSite(newSite)}
        setUserDetails={(data: any) => {
          setSite(data.currentSite || data.site);
        }}
      />
      {isAuthenticated && (
        <div className={styles.homeLayout}>
          <div className={styles.centerGrid}>
            <Breadcrumbs />
            {CENTER_GRID_GROUPS.map((group) => (
              <div key={group.key} className={styles.groupSection}>
                <h3 className={styles.groupLabel}>{t(group.labelKey)}</h3>
                <div className={styles.tileWrapper}>
                  {group.apps?.map((app) => (
                    <Tile
                      key={app.key}
                      description={t(app.labelKey)}
                      url={app.route}
                      activityId={app.key}
                      subLabel={t(app.subLabelKey)}
                      badgeCount={MOCK_BADGE_COUNTS[app.key] || 0}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <RightPanel />
        </div>
      )}
    </div>
  );
};

export default HomePage;
