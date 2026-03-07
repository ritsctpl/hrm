'use client';
import { Tooltip } from 'antd';
import dayjs from 'dayjs';
import DayColorIndicator from '../atoms/DayColorIndicator';
import TimesheetStatusBadge from '../atoms/TimesheetStatusBadge';
import { DAY_COLOR_STYLES } from '../../utils/timesheetConstants';
import type { WeekDaySummary } from '../../types/ui.types';
import styles from '../../styles/HrmTimesheet.module.css';

interface Props {
  day: WeekDaySummary;
  isSelected: boolean;
  onClick: () => void;
}

export default function DaySummaryCard({ day, isSelected, onClick }: Props) {
  const colorStyle = DAY_COLOR_STYLES[day.colorCode] ?? DAY_COLOR_STYLES.GREY;
  const dayLabel = dayjs(day.date).format('ddd');
  const dateLabel = dayjs(day.date).format('D');

  return (
    <Tooltip title={`${day.totalHours.toFixed(1)} h — ${day.status}`}>
      <div
        className={`${styles.daySummaryCard} ${isSelected ? styles.daySummaryCardSelected : ''}`}
        onClick={onClick}
        style={{
          background: isSelected ? colorStyle.background : undefined,
          borderColor: isSelected ? colorStyle.border : undefined,
          cursor: 'pointer',
        }}
      >
        <div className={styles.dayLabel}>{dayLabel}</div>
        <div className={styles.dateLabel}>{dateLabel}</div>
        {day.isHoliday ? (
          <div className={styles.dayHolidayLabel}>HOL</div>
        ) : day.isLeave ? (
          <div className={styles.dayLeaveLabel}>LVE</div>
        ) : (
          <>
            <div className={styles.dayHours} style={{ color: colorStyle.text }}>
              {day.totalHours > 0 ? `${day.totalHours.toFixed(1)}h` : '—'}
            </div>
            <DayColorIndicator colorCode={day.colorCode} size="sm" />
          </>
        )}
        {day.status !== 'EMPTY' && day.status !== 'DRAFT' && (
          <div style={{ marginTop: 2 }}>
            <TimesheetStatusBadge status={day.status as import('../../types/domain.types').TimesheetStatus} />
          </div>
        )}
      </div>
    </Tooltip>
  );
}
