'use client';

import React, { useCallback, useMemo } from 'react';
import { Calendar, Tag } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import styles from '../styles/HrmShared.module.css';

interface CalendarEvent {
  date: string;
  title: string;
  type: string;
  color?: string;
}

interface HrmCalendarViewProps {
  events: CalendarEvent[];
  view: 'month' | 'week';
  onDateClick: (date: string) => void;
  currentDate?: string;
}

/**
 * HrmCalendarView
 *
 * Monthly calendar grid that renders events on their respective dates.
 * Events appear as small colored tags inside each date cell.
 *
 * @param events      - Array of calendar events with date, title, type, color
 * @param view        - 'month' for full month view, 'week' currently renders month
 * @param onDateClick - Called with ISO date string when a date cell is clicked
 * @param currentDate - ISO date string to set the initial calendar position
 */
const HrmCalendarView: React.FC<HrmCalendarViewProps> = ({
  events,
  view,
  onDateClick,
  currentDate,
}) => {
  // Group events by date for O(1) lookup during cell rendering
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((evt) => {
      const key = dayjs(evt.date).format('YYYY-MM-DD');
      if (!map[key]) map[key] = [];
      map[key].push(evt);
    });
    return map;
  }, [events]);

  const dateCellRender = useCallback(
    (date: Dayjs) => {
      const key = date.format('YYYY-MM-DD');
      const dayEvents = eventsByDate[key];

      if (!dayEvents || dayEvents.length === 0) return null;

      return (
        <div className={styles.calendarEventList}>
          {dayEvents.slice(0, 3).map((evt, idx) => (
            <Tag
              key={`${evt.date}-${evt.type}-${idx}`}
              color={evt.color ?? 'blue'}
              className={styles.calendarEventTag}
            >
              {evt.title}
            </Tag>
          ))}
          {dayEvents.length > 3 && (
            <span style={{ fontSize: 10, color: '#8c8c8c' }}>
              +{dayEvents.length - 3} more
            </span>
          )}
        </div>
      );
    },
    [eventsByDate],
  );

  const handleSelect = useCallback(
    (date: Dayjs) => {
      onDateClick(date.format('YYYY-MM-DD'));
    },
    [onDateClick],
  );

  const defaultValue = currentDate ? dayjs(currentDate) : dayjs();

  return (
    <Calendar
      mode={view === 'week' ? 'month' : 'month'}
      defaultValue={defaultValue}
      cellRender={(date, info) => {
        if (info.type === 'date') return dateCellRender(date as Dayjs);
        return null;
      }}
      onSelect={handleSelect}
      fullscreen
    />
  );
};

export default HrmCalendarView;
