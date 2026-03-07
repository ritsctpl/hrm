'use client';

import { Tag } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { PendingRequest } from '../../types/domain.types';
import styles from '../../styles/Dashboard.module.css';

dayjs.extend(relativeTime);

const TYPE_COLOR: Record<string, string> = {
  LEAVE: 'blue',
  EXPENSE: 'orange',
  ASSET: 'purple',
  TRAVEL: 'cyan',
  TIMESHEET: 'geekblue',
};

interface PendingRequestItemProps {
  item: PendingRequest;
}

export default function PendingRequestItem({ item }: PendingRequestItemProps) {
  return (
    <div className={styles.pendingRequestItem}>
      <Tag color={TYPE_COLOR[item.type] ?? 'default'} className={styles.requestTag}>
        {item.type}
      </Tag>
      <div className={styles.requestInfo}>
        <span className={styles.requestTitle}>{item.title}</span>
        <span className={styles.requestTime}>{dayjs(item.submittedAt).fromNow()}</span>
      </div>
      <span className={styles.requestStatus}>{item.status}</span>
    </div>
  );
}
