'use client';

import { Button } from 'antd';
import styles from '../../styles/NotificationCentre.module.css';

interface NotificationPopoverHeaderProps {
  onMarkAllRead: () => void;
  loading: boolean;
  unreadCount: number;
}

export default function NotificationPopoverHeader({
  onMarkAllRead,
  loading,
  unreadCount,
}: NotificationPopoverHeaderProps) {
  return (
    <div className={styles.popoverHeader}>
      <span>Notifications</span>
      <Button
        type="link"
        size="small"
        loading={loading}
        disabled={unreadCount === 0}
        onClick={onMarkAllRead}
        style={{ padding: 0, fontSize: 12 }}
      >
        Mark All Read
      </Button>
    </div>
  );
}
