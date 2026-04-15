'use client';

import { Skeleton, Button, Spin } from 'antd';
import NotificationItem from '../molecules/NotificationItem';
import type { NotificationListProps } from '../../types/ui.types';
import styles from '../../styles/NotificationCentre.module.css';

export default function NotificationList({
  notifications,
  loading,
  hasMore,
  onLoadMore,
  onMarkRead,
  onMarkAllRead,
}: NotificationListProps) {
  if (loading && notifications.length === 0) {
    return (
      <div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.skeletonRow}>
            <Skeleton active avatar paragraph={{ rows: 1 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {notifications.map((n) => (
        <NotificationItem
          key={n.id}
          notification={n}
          onMarkRead={onMarkRead}
        />
      ))}
      {(loading || hasMore) && (
        <div className={styles.loadMoreWrapper}>
          {loading ? (
            <Spin size="small" />
          ) : (
            <Button type="link" onClick={onLoadMore}>
              Load more...
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
