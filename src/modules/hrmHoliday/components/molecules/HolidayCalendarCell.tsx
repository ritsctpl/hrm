'use client';

import { Tooltip } from 'antd';
import type { CalendarDay } from '../../utils/calendarHelpers';
import styles from '../../styles/HolidayCalendar.module.css';

interface HolidayCalendarCellProps {
  day: CalendarDay;
  onHolidayClick?: (holidayHandle: string) => void;
}

export default function HolidayCalendarCell({ day, onHolidayClick }: HolidayCalendarCellProps) {
  const cellClass = [
    styles.calendarCell,
    !day.isCurrentMonth ? styles.calendarCellOutside : '',
    day.isToday ? styles.calendarCellToday : '',
    day.isPast && day.isCurrentMonth ? styles.calendarCellPast : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cellClass}>
      <span className={styles.dayNumber}>{day.isCurrentMonth ? day.dayNumber : ''}</span>
      <div className={styles.holidayList}>
        {day.holidays.map((h) => (
          <div
            key={h.handle}
            className={`${styles.holidayItem} ${h.optional ? styles.holidayItemOptional : ''}`}
            style={{
              backgroundColor: h.categoryColorHex || '#1890ff',
              color: '#ffffff',
              opacity: day.isPast ? 0.7 : 1,
              borderLeft: `3px solid ${h.categoryColorHex || '#1890ff'}`,
            }}
            onClick={() => onHolidayClick?.(h.handle)}
            title={h.name}
          >
            <span className={styles.holidayName}>{h.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
