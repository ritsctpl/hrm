'use client';
import dayjs from 'dayjs';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import DaySummaryCard from '../molecules/DaySummaryCard';
import WeekNavigator from '../molecules/WeekNavigator';
import type { WeekDaySummary } from '../../types/ui.types';
import type { TimesheetHeader } from '../../types/domain.types';
import styles from '../../styles/HrmTimesheet.module.css';

interface Props {
  weeklyTimesheets: TimesheetHeader[];
  loading?: boolean;
}

function buildWeekDays(weekStart: string, timesheets: TimesheetHeader[] = []): WeekDaySummary[] {
  const days: WeekDaySummary[] = [];
  for (let i = 0; i < 7; i++) {
    const date = dayjs(weekStart).add(i, 'day').format('YYYY-MM-DD');
    const ts = timesheets.find((t) => t.date === date);
    days.push({
      date,
      dayLabel: dayjs(date).format('ddd'),
      totalHours: ts?.totalHours ?? 0,
      colorCode: ts?.colorCode ?? 'GREY',
      status: ts?.status ?? 'EMPTY',
      isHoliday: ts?.isHoliday ?? false,
      isLeave: ts?.isLeaveDay ?? false,
      timesheetHandle: ts?.handle,
    });
  }
  return days;
}

export default function WeekCalendarBar({ weeklyTimesheets, loading }: Props) {
  const { selectedDate, selectedWeekStart, setSelectedDate } = useHrmTimesheetStore();
  const days = buildWeekDays(selectedWeekStart, Array.isArray(weeklyTimesheets) ? weeklyTimesheets : []);

  return (
    <div className={styles.weekCalendarBar}>
      <div className={styles.weekNavSection}>
        <WeekNavigator />
      </div>
      <div className={styles.daySummaryStrip}>
        {days.map((day) => (
          <DaySummaryCard
            key={day.date}
            day={day}
            isSelected={day.date === selectedDate}
            onClick={() => setSelectedDate(day.date)}
          />
        ))}
      </div>
    </div>
  );
}
