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
      <div className={styles.holidayDots}>
        {day.holidays.slice(0, 3).map((h) => (
          <Tooltip key={h.handle} title={h.name}>
            <span
              className={`${styles.holidayDot} ${h.optional ? styles.holidayDotOptional : ''}`}
              style={{
                backgroundColor: day.isPast ? undefined : h.categoryColorHex,
                opacity: day.isPast ? 0.5 : 1,
              }}
              onClick={() => onHolidayClick?.(h.handle)}
            />
          </Tooltip>
        ))}
        {day.holidays.length > 3 && (
          <span className={styles.holidayMoreDot}>+{day.holidays.length - 3}</span>
        )}
      </div>
    </div>
  );
}
