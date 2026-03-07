'use client';

import { Button } from 'antd';
import styles from '../../styles/NotificationCentre.module.css';

interface NotificationEmptyStateProps {
  hasFilter: boolean;
  onClearFilter?: () => void;
}

export default function NotificationEmptyState({ hasFilter, onClearFilter }: NotificationEmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>{hasFilter ? '🔍' : '🔔'}</div>
      <div style={{ fontWeight: 600, fontSize: 14, color: '#595959' }}>
        {hasFilter ? 'No notifications for this filter' : 'You have no notifications'}
      </div>
      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
        {hasFilter ? 'Try clearing the filter to see all notifications.' : 'Check back later.'}
      </div>
      {hasFilter && onClearFilter && (
        <Button size="small" onClick={onClearFilter} style={{ marginTop: 8 }}>
          Clear Filter
        </Button>
      )}
    </div>
  );
}
