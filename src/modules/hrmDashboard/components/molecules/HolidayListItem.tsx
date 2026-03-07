'use client';

import { CalendarOutlined } from '@ant-design/icons';
import { HolidayItem } from '../../types/domain.types';
import styles from '../../styles/Dashboard.module.css';

interface HolidayListItemProps {
  item: HolidayItem;
}

export default function HolidayListItem({ item }: HolidayListItemProps) {
  return (
    <div className={styles.holidayItem}>
      <CalendarOutlined className={styles.holidayIcon} />
      <div className={styles.holidayInfo}>
        <span className={styles.holidayName}>{item.name}</span>
        <span className={styles.holidayDate}>{item.date}</span>
      </div>
      {item.daysFrom !== undefined && (
        <span className={styles.holidayDaysFrom}>
          {item.daysFrom === 0 ? 'Today' : item.daysFrom === 1 ? 'Tomorrow' : `In ${item.daysFrom} days`}
        </span>
      )}
    </div>
  );
}
