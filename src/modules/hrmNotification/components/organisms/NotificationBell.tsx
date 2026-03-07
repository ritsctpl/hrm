'use client';

import { useEffect } from 'react';
import { Badge, Popover } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useHrmNotificationStore } from '../../stores/hrmNotificationStore';
import { HrmNotificationService } from '../../services/hrmNotificationService';
import NotificationPopover from './NotificationPopover';
import { POLLING_INTERVAL_MS } from '../../utils/notificationConstants';
import styles from '../../styles/NotificationBell.module.css';

interface NotificationBellProps {
  site: string;
  recipientId: string;
}

export default function NotificationBell({ site, recipientId }: NotificationBellProps) {
  const { unreadCount, isPopoverOpen, setUnreadCount, setPopoverOpen } =
    useHrmNotificationStore();

  useEffect(() => {
    if (!site || !recipientId) return;

    const fetchCount = async () => {
      try {
        const count = await HrmNotificationService.getUnreadCount(site, recipientId);
        setUnreadCount(count);
      } catch {
        // silent polling failure
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [site, recipientId, setUnreadCount]);

  return (
    <Popover
      content={
        <NotificationPopover site={site} recipientId={recipientId} />
      }
      trigger="click"
      open={isPopoverOpen}
      onOpenChange={setPopoverOpen}
      placement="bottomRight"
      overlayClassName={styles.notificationPopoverOverlay}
    >
      <Badge count={unreadCount} overflowCount={99} className={styles.bellBadge}>
        <BellOutlined className={styles.bellIcon} />
      </Badge>
    </Popover>
  );
}
