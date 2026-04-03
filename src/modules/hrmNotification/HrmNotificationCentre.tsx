'use client';

import { useEffect, useCallback } from 'react';
import { Select, Radio, Button } from 'antd';
import { parseCookies } from 'nookies';
import CommonAppBar from '@/components/CommonAppBar';
import NotificationList from './components/organisms/NotificationList';
import NotificationCentreTemplate from './components/templates/NotificationCentreTemplate';
import NotificationEmptyState from './components/molecules/NotificationEmptyState';
import { useHrmNotificationStore } from './stores/hrmNotificationStore';
import { useNotificationData } from './hooks/useNotificationData';
import { NOTIFICATION_TYPE_OPTIONS } from './utils/notificationConstants';
import styles from './styles/NotificationCentre.module.css';

export default function HrmNotificationCentre() {
  const {
    notifications,
    unreadCount,
    hasMore,
    currentPage,
    filterType,
    filterRead,
    loadingNotifications,
    markingAllRead,
    setFilterType,
    setFilterRead,
  } = useHrmNotificationStore();

  const { loadNotifications, handleMarkRead, handleMarkAllRead } = useNotificationData();

  const cookies = parseCookies();
  const site = cookies.site ?? '';
  const recipientId = cookies.employeeId ?? cookies.userId ?? '';

  const reload = useCallback(() => {
    loadNotifications(0, true);
  }, [loadNotifications]);

  useEffect(() => {
    reload();
  }, [filterType, filterRead]);

  const handleLoadMore = () => {
    if (!loadingNotifications && hasMore) {
      loadNotifications(currentPage + 1, false);
    }
  };

  const handleClearFilter = () => {
    setFilterType('');
    setFilterRead('all');
  };

  const hasFilter = !!filterType || filterRead !== 'all';
  const isEmpty = !loadingNotifications && notifications.length === 0;

  return (
    <div className={`hrm-module-root ${styles.centreRoot}`}>
      <CommonAppBar appTitle="Notifications" />

      <NotificationCentreTemplate
        filtersSlot={
          <>
            <Select
              value={filterType || undefined}
              placeholder="All Types"
              allowClear
              onChange={(val) => setFilterType(val ?? '')}
              options={NOTIFICATION_TYPE_OPTIONS}
              style={{ width: 200 }}
            />
            <Radio.Group
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              options={[
                { value: 'all', label: 'All' },
                { value: 'unread', label: 'Unread Only' },
              ]}
            />
            {unreadCount > 0 && (
              <Button
                size="small"
                loading={markingAllRead}
                onClick={handleMarkAllRead}
                style={{ marginLeft: 'auto' }}
              >
                Mark All Read
              </Button>
            )}
          </>
        }
        listSlot={
          isEmpty ? (
            <NotificationEmptyState
              hasFilter={hasFilter}
              onClearFilter={hasFilter ? handleClearFilter : undefined}
            />
          ) : (
            <NotificationList
              notifications={notifications}
              loading={loadingNotifications}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
            />
          )
        }
      />
    </div>
  );
}
