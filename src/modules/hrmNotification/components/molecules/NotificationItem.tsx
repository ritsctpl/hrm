'use client';

import { Button, Tooltip } from 'antd';
import { useRouter } from 'next/navigation';
import NotificationDot from '../atoms/NotificationDot';
import NotificationTypeBadge from '../atoms/NotificationTypeBadge';
import { getRelativeTime, getDeepLink } from '../../utils/notificationHelpers';
import type { NotificationItemProps } from '../../types/ui.types';
import styles from '../../styles/NotificationCentre.module.css';

export default function NotificationItem({
  notification,
  onMarkRead,
  onDeepLink,
  compact = false,
}: NotificationItemProps) {
  const router = useRouter();
  const deepLink = getDeepLink(notification);

  const handleClick = () => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    if (onDeepLink) {
      onDeepLink(notification);
    } else if (deepLink) {
      router.push(deepLink);
    }
  };

  const handleDeepLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    if (deepLink) {
      router.push(deepLink);
    }
  };

  const handleMarkReadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkRead(notification.id);
  };

  return (
    <div
      className={`${styles.notificationItem} ${notification.read ? '' : styles.notificationItemUnread} ${compact ? styles.compactItem : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className={styles.itemLeft}>
        <NotificationDot visible={!notification.read} />
        <NotificationTypeBadge type={notification.type} />
      </div>
      <div className={styles.itemBody}>
        <div className={styles.itemTitle}>{notification.title}</div>
        <div className={styles.itemMessage}>{notification.message}</div>
        <div className={styles.itemMeta}>
          <span className={styles.itemTime}>
            {getRelativeTime(notification.createdAt)}
          </span>
          <div className={styles.itemActions}>
            {deepLink && !compact && (
              <Button
                type="link"
                size="small"
                onClick={handleDeepLinkClick}
                style={{ padding: 0, fontSize: 12, height: 'auto' }}
              >
                View →
              </Button>
            )}
            {!notification.read && (
              <Tooltip title="Mark as read">
                <Button
                  type="text"
                  size="small"
                  onClick={handleMarkReadClick}
                  style={{ padding: '0 4px', fontSize: 11, height: 'auto' }}
                >
                  ✓
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
