'use client';

import { Tag } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { AnnouncementAlert } from '../../types/domain.types';
import styles from '../../styles/Dashboard.module.css';

dayjs.extend(relativeTime);

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: 'red',
  HIGH: 'orange',
  MEDIUM: 'blue',
  LOW: 'default',
};

interface AnnouncementAlertItemProps {
  item: AnnouncementAlert;
}

export default function AnnouncementAlertItem({ item }: AnnouncementAlertItemProps) {
  return (
    <div className={`${styles.announcementAlertItem} ${item.isRead ? styles.alertRead : ''}`}>
      {!item.isRead && <span className={styles.alertUnreadDot} />}
      <div className={styles.alertContent}>
        <span className={styles.alertTitle}>{item.title}</span>
        <span className={styles.alertMeta}>
          <Tag color={PRIORITY_COLOR[item.priority] ?? 'default'} style={{ fontSize: 10 }}>
            {item.priority}
          </Tag>
          {dayjs(item.publishedAt).fromNow()}
        </span>
      </div>
    </div>
  );
}
