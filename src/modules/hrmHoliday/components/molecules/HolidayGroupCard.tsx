'use client';

import { Typography } from 'antd';
import HolidayStatusChip from '../atoms/HolidayStatusChip';
import type { HolidayGroupCardProps } from '../../types/ui.types';
import styles from '../../styles/HolidayGroupsTable.module.css';

export default function HolidayGroupCard({ group, isSelected, onClick }: HolidayGroupCardProps) {
  return (
    <div
      className={`${styles.groupCard} ${isSelected ? styles.groupCardSelected : ''}`}
      onClick={() => onClick(group)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(group)}
    >
      <div className={styles.groupCardTop}>
        <Typography.Text strong className={styles.groupCardName} ellipsis>
          {group.groupName}
        </Typography.Text>
        <HolidayStatusChip status={group.status} />
      </div>
      <div className={styles.groupCardMeta}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {group.year}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {group.totalHolidays} holiday{group.totalHolidays !== 1 ? 's' : ''}
        </Typography.Text>
      </div>
    </div>
  );
}
