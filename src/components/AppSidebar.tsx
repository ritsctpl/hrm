'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Tooltip } from 'antd';
import { SIDEBAR_ITEMS, SIDEBAR_BOTTOM_ITEMS } from '@/config/dashboardConfig';
import type { SidebarItemConfig } from '@/config/dashboardConfig';
import SidebarFlyout from './SidebarFlyout';
import styles from './AppSidebar.module.css';

/* ─── Helpers ─── */

/** Check whether the current pathname belongs to a sidebar group */
function isGroupActive(item: SidebarItemConfig, pathname: string): boolean {
  if (item.type === 'direct-nav' && item.route) {
    return pathname.startsWith(item.route);
  }
  if (item.type === 'flyout' && item.apps) {
    return item.apps.some((app) => pathname.startsWith(app.route));
  }
  return false;
}

/* ─── Component ─── */

const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  /* Flyout state */
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const [flyoutTop, setFlyoutTop] = useState(0);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Clear both timers */
  const clearTimers = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  /** Open flyout with 200ms delay */
  const handleFlyoutEnter = useCallback(
    (key: string, iconEl: HTMLElement) => {
      // Cancel any pending hide
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      // If already showing this flyout, do nothing
      if (activeFlyout === key) return;

      showTimerRef.current = setTimeout(() => {
        const rect = iconEl.getBoundingClientRect();
        setFlyoutTop(rect.top);
        setActiveFlyout(key);
      }, 200);
    },
    [activeFlyout],
  );

  /** Close flyout with 300ms delay */
  const handleFlyoutLeave = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    hideTimerRef.current = setTimeout(() => {
      setActiveFlyout(null);
    }, 300);
  }, []);

  /** Cancel hide when mouse enters the flyout panel */
  const handleFlyoutPanelEnter = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  /** Restart hide when mouse leaves the flyout panel */
  const handleFlyoutPanelLeave = useCallback(() => {
    handleFlyoutLeave();
  }, [handleFlyoutLeave]);

  /** Close flyout (used after navigation) */
  const closeFlyout = useCallback(() => {
    clearTimers();
    setActiveFlyout(null);
  }, [clearTimers]);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  /* ─── Render a single sidebar icon ─── */
  const renderIcon = (item: SidebarItemConfig) => {
    const Icon = item.icon;
    const active = isGroupActive(item, pathname);
    const isFlyout = item.type === 'flyout';

    const iconClassName = [
      styles.sidebarIcon,
      active ? styles.sidebarIconActive : '',
    ]
      .filter(Boolean)
      .join(' ');

    const handleClick = (e: React.MouseEvent) => {
      if (item.type === 'direct-nav' && item.route) {
        if (e.ctrlKey || e.metaKey) {
          window.open(`/hrm${item.route}`, '_blank');
        } else {
          router.push(item.route);
        }
      }
      if (item.type === 'flyout') {
        // Toggle flyout on click
        if (activeFlyout === item.key) {
          closeFlyout();
        } else {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setFlyoutTop(rect.top);
          setActiveFlyout(item.key);
        }
      }
    };

    const iconButton = (
      <button
        className={iconClassName}
        onClick={handleClick}
        onMouseEnter={(e) => {
          if (isFlyout) {
            handleFlyoutEnter(item.key, e.currentTarget as HTMLElement);
          }
        }}
        onMouseLeave={() => {
          if (isFlyout) {
            handleFlyoutLeave();
          }
        }}
        aria-label={item.label}
      >
        <Icon size={20} strokeWidth={1.8} />
      </button>
    );

    if (isFlyout) {
      // Flyout items: wrap in anchor div for flyout positioning
      const flyoutItem = SIDEBAR_ITEMS.find((si) => si.key === item.key) ?? item;
      return (
        <div key={item.key} className={styles.flyoutAnchor}>
          {iconButton}
          {activeFlyout === item.key && flyoutItem.apps && (
            <div
              onMouseEnter={handleFlyoutPanelEnter}
              onMouseLeave={handleFlyoutPanelLeave}
            >
              <SidebarFlyout
                title={item.label}
                apps={flyoutItem.apps}
                top={flyoutTop}
                onClose={closeFlyout}
              />
            </div>
          )}
        </div>
      );
    }

    // Direct-nav items: wrap with Tooltip
    return (
      <Tooltip key={item.key} title={item.label} placement="right" mouseEnterDelay={0.3}>
        {iconButton}
      </Tooltip>
    );
  };

  return (
    <nav className={styles.sidebar} role="navigation" aria-label="Main sidebar">
      {/* Brand Mark */}
      <div
        className={styles.brandMark}
        onClick={() => router.push('/')}
        role="button"
        tabIndex={0}
        aria-label="Go to homepage"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            router.push('/');
          }
        }}
      >
        <span className={styles.brandMarkText}>HR</span>
      </div>

      {/* Main Nav Icons */}
      <div className={styles.navGroup}>
        {SIDEBAR_ITEMS.map(renderIcon)}
      </div>

      {/* Divider + Bottom Icons */}
      <div className={styles.bottomSection}>
        <div className={styles.divider} />
        {SIDEBAR_BOTTOM_ITEMS.map(renderIcon)}
      </div>
    </nav>
  );
};

export default AppSidebar;
