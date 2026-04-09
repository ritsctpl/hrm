'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { getModuleIcon } from '@utils/moduleIconMap';
import { MOCK_BADGE_COUNTS } from '@/config/dashboardConfig';
import type { EnrichedModule } from '@modules/hrmAccess/types/rbac.types';
import styles from './AppSidebar.module.css';

interface SidebarFlyoutProps {
  title: string;
  modules: EnrichedModule[];
  top: number;
  onClose: () => void;
}

const SidebarFlyout: React.FC<SidebarFlyoutProps> = ({ title, modules, top, onClose }) => {
  const router = useRouter();

  const handleAppClick = (e: React.MouseEvent | React.KeyboardEvent, route: string) => {
    if (e.ctrlKey || e.metaKey) {
      window.open(`/hrm${route}`, '_blank');
    } else {
      router.push(route);
    }
    onClose();
  };

  const clampedTop = Math.min(top, typeof window !== 'undefined' ? window.innerHeight - 300 : top);

  return (
    <div
      className={styles.flyout}
      style={{ top: Math.max(48, clampedTop) }}
      onMouseEnter={(e) => e.stopPropagation()}
    >
      <div className={styles.flyoutTitle}>{title}</div>

      {modules.map((mod) => {
        const Icon = getModuleIcon(mod.appUrl);
        const badgeCount = MOCK_BADGE_COUNTS[mod.moduleCode] ?? 0;

        return (
          <div
            key={mod.moduleCode}
            className={styles.flyoutItem}
            onClick={(e) => handleAppClick(e, mod.appUrl)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAppClick(e, mod.appUrl);
              }
            }}
          >
            <div className={styles.flyoutItemIcon}>
              <Icon size={16} />
            </div>
            <div className={styles.flyoutItemText}>
              <div className={styles.flyoutItemName}>{mod.moduleName}</div>
              <div className={styles.flyoutSubLabel}>{mod.description || mod.moduleCategory}</div>
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
