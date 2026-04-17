'use client';

import { useEffect } from 'react';
import { Spin, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import NotificationPopoverHeader from '../molecules/NotificationPopoverHeader';
import NotificationItem from '../molecules/NotificationItem';
import { useHrmNotificationStore } from '../../stores/hrmNotificationStore';
import { useNotificationData } from '../../hooks/useNotificationData';
import { getDeepLink } from '../../utils/notificationHelpers';
import type { Notification } from '../../types/domain.types';
import styles from '../../styles/NotificationCentre.module.css';

interface NotificationPopoverProps {
  organizationId: string;
  recipientId: string;
}

export default function NotificationPopover({ organizationId, recipientId }: NotificationPopoverProps) {
  const router = useRouter();
  const {
    popoverNotifications,
    unreadCount,
    loadingPopover,
    markingAllRead,
    isPopoverOpen,
    setPopoverOpen,
  } = useHrmNotificationStore();

  const { loadPopoverNotifications, handleMarkRead, handleMarkAllRead } = useNotificationData();

  useEffect(() => {
    if (isPopoverOpen && organizationId && recipientId) {
      loadPopoverNotifications();
    }
  }, [isPopoverOpen, organizationId, recipientId]);

  const handleViewAll = () => {
    setPopoverOpen(false);
    router.push('/rits/hrm_notification_app');
  };

  const handleDeepLink = (n: Notification) => {
    setPopoverOpen(false);
    const link = getDeepLink(n);
    if (link) {
      router.push(link);
    }
  };

  return (
    <div style={{ minWidth: 340 }}>
      <NotificationPopoverHeader
        onMarkAllRead={handleMarkAllRead}
        loading={markingAllRead}
        unreadCount={unreadCount}
      />

      {loadingPopover ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin size="small" />
        </div>
      ) : popoverNotifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 16px', color: '#8c8c8c', fontSize: 13 }}>
          No new notifications
        </div>
      ) : (
        popoverNotifications.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            onMarkRead={handleMarkRead}
            onDeepLink={handleDeepLink}
            compact
          />
        ))
      )}

      <div className={styles.popoverFooter}>
        <Typography.Link onClick={handleViewAll} style={{ fontSize: 13 }}>
          View All Notifications →
        </Typography.Link>
      </div>
    </div>
  );
}
