'use client';
import { useEffect, useMemo } from 'react';
import { Alert, Button, Spin, Tag } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import { useHrmTimesheetData } from '../../hooks/useHrmTimesheetData';
import { useTimesheetHolidays } from '../../hooks/useTimesheetHolidays';
import {
  buildMonthMatrix,
  decimalToHHMM,
  isToday,
  isFutureDate,
  isInCurrentMonth,
  weekOfMonthIndex,
} from '../../utils/timesheetHelpers';
import type { TimesheetHeader } from '../../types/domain.types';
import styles from '../../styles/TimesheetCalendar.module.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MonthlyCalendarView() {
  const { selectedMonth, monthlyTimesheets, loadingMonth, setSelectedMonth, openWeekForDate } =
    useHrmTimesheetStore();
  const { loadMonthlyTimesheets } = useHrmTimesheetData();
  const { isHoliday, getHolidayName } = useTimesheetHolidays(dayjs(selectedMonth).year());

  useEffect(() => {
    void loadMonthlyTimesheets();
  }, [selectedMonth, loadMonthlyTimesheets]);

  // Quick lookup: date -> day timesheet
  const byDate = useMemo(() => {
    const m = new Map<string, TimesheetHeader>();
    monthlyTimesheets.forEach((t) => m.set(t.date, t));
    return m;
  }, [monthlyTimesheets]);

  const weeks = useMemo(() => buildMonthMatrix(selectedMonth), [selectedMonth]);
  const monthTotal = useMemo(
    () => monthlyTimesheets.reduce((s, t) => s + (t.totalHours ?? 0), 0),
    [monthlyTimesheets]
  );

  const monthLabel = dayjs(selectedMonth).format('MMMM YYYY');
  const atCurrentMonth = isInCurrentMonth(selectedMonth);

  // Status banners
  const hasApproved = monthlyTimesheets.some((t) => t.status === 'APPROVED');
  const hasRejected = monthlyTimesheets.some((t) => t.status === 'REJECTED');
  const unsubmittedWeeks = useMemo(() => {
    if (!atCurrentMonth) return [];
    const set = new Set<number>();
    monthlyTimesheets.forEach((t) => {
      const notSubmitted = t.status === 'DRAFT' || t.status === 'REOPENED' || t.status === 'REJECTED';
      if (notSubmitted && (t.totalHours ?? 0) > 0 && !isFutureDate(t.date)) {
        set.add(weekOfMonthIndex(t.date));
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [monthlyTimesheets, atCurrentMonth]);

  const prevMonth = () =>
    setSelectedMonth(dayjs(selectedMonth).subtract(1, 'month').format('YYYY-MM-01'));
  const nextMonth = () =>
    setSelectedMonth(dayjs(selectedMonth).add(1, 'month').format('YYYY-MM-01'));

  return (
    <div className={styles.calendarRoot}>
      <div className={styles.calHeader}>
        <div className={styles.calMonthNav}>
          <Button size="small" icon={<LeftOutlined />} onClick={prevMonth} />
          <span className={styles.calMonthTitle}>{monthLabel}</span>
          <Button
            size="small"
            icon={<RightOutlined />}
            onClick={nextMonth}
            disabled={atCurrentMonth}
            title={atCurrentMonth ? 'Future months are not available' : undefined}
          />
        </div>
        <div className={styles.calTotal}>
          Total Hours
          <span className={styles.calTotalValue}>{decimalToHHMM(monthTotal)}</span>
        </div>
      </div>

      {hasApproved && !hasRejected && (
        <Alert
          type="info"
          showIcon
          message="Your timesheet has been approved."
          style={{ marginBottom: 8 }}
        />
      )}
      {unsubmittedWeeks.length > 0 && (
        <Alert
          type="error"
          showIcon
          message={`Week-${unsubmittedWeeks.join(', Week-')} timesheet(s) of ${dayjs(selectedMonth).format('MMMM')} ${
            unsubmittedWeeks.length > 1 ? 'have' : 'has'
          } not been submitted.`}
          style={{ marginBottom: 12 }}
        />
      )}

      {loadingMonth ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : (
        <>
          <div className={styles.weekdayRow}>
            {WEEKDAYS.map((d) => (
              <div key={d} className={styles.weekdayCell}>
                {d}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className={styles.calWeek}>
              {week.map((cell) => {
                const ts = byDate.get(cell.date);
                const future = isFutureDate(cell.date);
                const today = isToday(cell.date);
                const hours = ts?.totalHours ?? 0;
                const holiday = cell.inMonth && (isHoliday(cell.date) || !!ts?.holiday);
                const holidayName = getHolidayName(cell.date);
                // Holiday days are locked from entry, so not clickable into the week.
                const clickable = cell.inMonth && !future && !holiday;
                const cellClass = [
                  styles.calCell,
                  !cell.inMonth ? styles.calCellOutMonth : '',
                  cell.inMonth && future ? styles.calCellFuture : '',
                  holiday ? styles.calHolidayCell : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <div
                    key={cell.date}
                    className={cellClass}
                    title={holiday ? holidayName : undefined}
                    onClick={() => clickable && openWeekForDate(cell.date)}
                  >
                    <div className={styles.calCellTop}>
                      <span className={`${styles.calDateNum} ${today ? styles.calDateToday : ''}`}>
                        {dayjs(cell.date).format('D')}
                      </span>
                      {holiday && <Tag color="green" style={{ margin: 0 }}>Hol</Tag>}
                      {ts?.leaveDay && !holiday && <Tag color="orange" style={{ margin: 0 }}>Lve</Tag>}
                    </div>
                    {cell.inMonth && (
                      <>
                        {holiday ? (
                          <span className={styles.calHolidayLabel} title={holidayName}>
                            {holidayName || 'Holiday'}
                          </span>
                        ) : (
                          <>
                            <div className={styles.calHours}>{decimalToHHMM(hours)}</div>
                            {hours === 0 && !future && !ts?.leaveDay && (
                              <span className={styles.calNoEntry}>No Entry</span>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
