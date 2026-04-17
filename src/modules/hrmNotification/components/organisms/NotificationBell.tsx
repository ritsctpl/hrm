'use client';

import { Badge, Popover } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useHrmNotificationStore } from '../../stores/hrmNotificationStore';
import NotificationPopover from './NotificationPopover';
import styles from '../../styles/NotificationBell.module.css';

interface NotificationBellProps {
  organizationId: string;
  recipientId: string;
}

export default function NotificationBell({ organizationId, recipientId }: NotificationBellProps) {
  const { unreadCount, isPopoverOpen, setPopoverOpen } = useHrmNotificationStore();

  return (
    <Popover
      content={
        <NotificationPopover organizationId={organizationId} recipientId={recipientId} />
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
