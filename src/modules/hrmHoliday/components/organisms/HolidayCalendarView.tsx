'use client';

import { Button, Space, Select } from 'antd';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HolidayCalendarCell from '../molecules/HolidayCalendarCell';
import HolidayLegend from '../molecules/HolidayLegend';
import type { HolidayCalendarViewProps } from '../../types/ui.types';
import type { Holiday } from '../../types/domain.types';
import { buildMonthGrid, getHolidaysForMonth } from '../../utils/calendarHelpers';
import { DAYS_OF_WEEK, MONTHS } from '../../utils/constants';
import styles from '../../styles/HolidayCalendar.module.css';

export default function HolidayCalendarView({
  holidays,
  categories,
  year,
  month,
  onMonthChange,
  onHolidayClick,
}: HolidayCalendarViewProps) {
  const monthHolidays = getHolidaysForMonth(holidays, year, month);
  const grid = buildMonthGrid(year, month, monthHolidays);

  const prevMonth = () => onMonthChange(month === 1 ? 12 : month - 1);
  const nextMonth = () => onMonthChange(month === 12 ? 1 : month + 1);

  const handleHolidayClick = (handle: string) => {
    const h = holidays.find((x: Holiday) => x.handle === handle);
    if (h && onHolidayClick) onHolidayClick(h);
  };

  return (
    <div className={styles.calendarWrapper}>
      <div className={styles.calendarHeader}>
        <Space>
          <Button type="text" icon={<ChevronLeftIcon />} onClick={prevMonth} />
          <span className={styles.calendarTitle}>
            {MONTHS[month - 1]} {year}
          </span>
          <Button type="text" icon={<ChevronRightIcon />} onClick={nextMonth} />
        </Space>
        <Select
          value={month}
          onChange={onMonthChange}
          style={{ width: 120 }}
          options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
          size="small"
        />
      </div>

      <div className={styles.calendarGrid}>
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className={styles.dayHeader}>
            {d}
          </div>
        ))}
        {grid.flat().map((day, idx) => (
          <HolidayCalendarCell
            key={idx}
            day={day}
            onHolidayClick={handleHolidayClick}
          />
        ))}
      </div>

      <HolidayLegend categories={categories} />
    </div>
  );
}
