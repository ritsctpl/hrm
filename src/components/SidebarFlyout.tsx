'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { getModuleIcon } from '@utils/moduleIconMap';
import { MOCK_BADGE_COUNTS } from '@/config/dashboardConfig';
import type { AppTileConfig } from '@/config/dashboardConfig';
import styles from './AppSidebar.module.css';

interface SidebarFlyoutProps {
  title: string;
  apps: AppTileConfig[];
  top: number;
  onClose: () => void;
}

const SidebarFlyout: React.FC<SidebarFlyoutProps> = ({ title, apps, top, onClose }) => {
  const router = useRouter();
  const { t } = useTranslation();

  const handleAppClick = (route: string) => {
    router.push(route);
    onClose();
  };

  // Clamp flyout so it doesn't overflow below the viewport
  const clampedTop = Math.min(top, typeof window !== 'undefined' ? window.innerHeight - 300 : top);

  return (
    <div
      className={styles.flyout}
      style={{ top: Math.max(48, clampedTop) }}
      onMouseEnter={(e) => {
        // Prevent close when hovering over flyout
        e.stopPropagation();
      }}
    >
      <div className={styles.flyoutTitle}>{title}</div>

      {apps.map((app) => {
        const Icon = getModuleIcon(app.route);
        const badgeCount = MOCK_BADGE_COUNTS[app.key] ?? 0;

        return (
          <div
            key={app.key}
            className={styles.flyoutItem}
            onClick={() => handleAppClick(app.route)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAppClick(app.route);
              }
            }}
          >
            <div className={styles.flyoutItemIcon}>
              <Icon size={16} />
            </div>

            <div className={styles.flyoutItemText}>
              <div className={styles.flyoutItemName}>{t(app.labelKey)}</div>
              <div className={styles.flyoutSubLabel}>{t(app.subLabelKey)}</div>
            </div>

            {badgeCount > 0 && (
              <span className={styles.badge}>{badgeCount}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SidebarFlyout;
