'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Tooltip } from 'antd';
import {
  CATEGORY_ICON_MAP,
  CATEGORY_ORDER,
  SIDEBAR_TOP_ITEMS,
  SIDEBAR_BOTTOM_ITEMS,
} from '@/config/dashboardConfig';
import type { SidebarFixedItem } from '@/config/dashboardConfig';
import { useHrmRbacStore } from '@/modules/hrmAccess/stores/hrmRbacStore';
import { Blocks } from 'lucide-react';
import type { EnrichedModule } from '@modules/hrmAccess/types/rbac.types';
import SidebarFlyout from './SidebarFlyout';
import styles from './AppSidebar.module.css';

/* ─── Types ─── */

interface CategoryGroup {
  key: string;
  label: string;
  modules: EnrichedModule[];
}

/* ─── Component ─── */

const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const modulesByCategory = useHrmRbacStore((s) => s.modulesByCategory);
  const hasModuleAccess = useHrmRbacStore((s) => s.hasModuleAccess);
  const isRbacReady = useHrmRbacStore((s) => s.isReady);

  /* Build dynamic category groups from API data */
  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    if (!isRbacReady) return [];
    const groups: CategoryGroup[] = [];
    // First add categories in defined order
    for (const cat of CATEGORY_ORDER) {
      const modules = modulesByCategory[cat];
      if (modules && modules.length > 0) {
        groups.push({ key: cat, label: cat, modules });
      }
    }
    // Then add any categories from API not in CATEGORY_ORDER
    for (const [cat, modules] of Object.entries(modulesByCategory)) {
      if (!CATEGORY_ORDER.includes(cat) && modules.length > 0) {
        groups.push({ key: cat, label: cat, modules });
      }
    }
    return groups;
  }, [isRbacReady, modulesByCategory]);

  /* Filter fixed top items by RBAC */
  const filteredTopItems = useMemo(() => {
    if (!isRbacReady) return SIDEBAR_TOP_ITEMS;
    return SIDEBAR_TOP_ITEMS.filter((item) => hasModuleAccess(item.route));
  }, [isRbacReady, hasModuleAccess]);

  /* Filter fixed bottom items by RBAC */
  const filteredBottomItems = useMemo(() => {
    if (!isRbacReady) return SIDEBAR_BOTTOM_ITEMS;
    return SIDEBAR_BOTTOM_ITEMS.filter((item) => hasModuleAccess(item.route));
  }, [isRbacReady, hasModuleAccess]);

  /* Flyout state */
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const [flyoutTop, setFlyoutTop] = useState(0);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (showTimerRef.current) { clearTimeout(showTimerRef.current); showTimerRef.current = null; }
    if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
  }, []);

  const handleFlyoutEnter = useCallback(
    (key: string, iconEl: HTMLElement) => {
      if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
      if (activeFlyout === key) return;
      showTimerRef.current = setTimeout(() => {
        const rect = iconEl.getBoundingClientRect();
        setFlyoutTop(rect.top);
        setActiveFlyout(key);
      }, 200);
    },
    [activeFlyout],
  );

  const handleFlyoutLeave = useCallback(() => {
    if (showTimerRef.current) { clearTimeout(showTimerRef.current); showTimerRef.current = null; }
    hideTimerRef.current = setTimeout(() => { setActiveFlyout(null); }, 300);
  }, []);

  const handleFlyoutPanelEnter = useCallback(() => {
    if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
  }, []);

  const handleFlyoutPanelLeave = useCallback(() => { handleFlyoutLeave(); }, [handleFlyoutLeave]);

  const closeFlyout = useCallback(() => { clearTimers(); setActiveFlyout(null); }, [clearTimers]);

  useEffect(() => { return () => clearTimers(); }, [clearTimers]);

  /* ─── Check if any module in a category is active ─── */
  const isCategoryActive = (group: CategoryGroup): boolean => {
    return group.modules.some((m) => pathname.startsWith(m.appUrl));
  };

  /* ─── Render a direct-nav icon ─── */
  const renderDirectNav = (item: SidebarFixedItem) => {
    const Icon = item.icon;
    const active = pathname.startsWith(item.route);
    const iconClassName = [styles.sidebarIcon, active ? styles.sidebarIconActive : ''].filter(Boolean).join(' ');

    return (
      <Tooltip key={item.key} title={item.label} placement="right" mouseEnterDelay={0.3}>
        <button
          className={iconClassName}
          onClick={(e) => {
            if (e.ctrlKey || e.metaKey) {
              window.open(`/hrm${item.route}`, '_blank');
            } else {
              router.push(item.route);
            }
          }}
          aria-label={item.label}
        >
          <Icon size={20} strokeWidth={1.8} />
        </button>
      </Tooltip>
    );
  };

  /* ─── Render a category flyout icon ─── */
  const renderCategoryFlyout = (group: CategoryGroup) => {
    const Icon = CATEGORY_ICON_MAP[group.key] || Blocks;
    const active = isCategoryActive(group);
    const iconClassName = [styles.sidebarIcon, active ? styles.sidebarIconActive : ''].filter(Boolean).join(' ');

    return (
      <div key={group.key} className={styles.flyoutAnchor}>
        <button
          className={iconClassName}
          onClick={(e) => {
            if (activeFlyout === group.key) {
              closeFlyout();
            } else {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setFlyoutTop(rect.top);
              setActiveFlyout(group.key);
            }
          }}
          onMouseEnter={(e) => handleFlyoutEnter(group.key, e.currentTarget as HTMLElement)}
          onMouseLeave={() => handleFlyoutLeave()}
          aria-label={group.label}
        >
          <Icon size={20} strokeWidth={1.8} />
        </button>
        {activeFlyout === group.key && (
          <div onMouseEnter={handleFlyoutPanelEnter} onMouseLeave={handleFlyoutPanelLeave}>
            <SidebarFlyout
              title={group.label}
              modules={group.modules}
              top={flyoutTop}
              onClose={closeFlyout}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className={styles.sidebar} role="navigation" aria-label="Main sidebar">
      <div
        className={styles.brandMark}
        onClick={() => router.push('/')}
        role="button"
        tabIndex={0}
        aria-label="Go to homepage"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/'); } }}
      >
        <span className={styles.brandMarkText}>HR</span>
      </div>

      <div className={styles.navGroup}>
        {filteredTopItems.map(renderDirectNav)}
        {categoryGroups.map(renderCategoryFlyout)}
      </div>

      {filteredBottomItems.length > 0 && (
        <div className={styles.bottomSection}>
          <div className={styles.divider} />
          {filteredBottomItems.map(renderDirectNav)}
        </div>
      )}
    </nav>
  );
};

export default AppSidebar;
