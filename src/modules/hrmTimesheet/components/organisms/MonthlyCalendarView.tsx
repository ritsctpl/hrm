'use client';
import { useEffect, useMemo } from 'react';
import { Alert, Button, Spin, Tag } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import { useHrmTimesheetData } from '../../hooks/useHrmTimesheetData';
import { useTimesheetHolidays } from '../../hooks/useTimesheetHolidays';
import { useTimesheetTravel } from '../../hooks/useTimesheetTravel';
import {
  buildMonthMatrix,
  decimalToHHMM,
  isToday,
  isFutureDate,
  isInCurrentMonth,
  isWithinTimesheetWindow,
  isWeekendDate,
  pendingSubmissionWeeks,
  WEEKDAY_LABELS,
} from '../../utils/timesheetHelpers';
import type { TimesheetHeader } from '../../types/domain.types';
import styles from '../../styles/TimesheetCalendar.module.css';

export default function MonthlyCalendarView() {
  const { selectedMonth, monthlyTimesheets, loadingMonth, setSelectedMonth, openWeekForDate } =
    useHrmTimesheetStore();
  const { loadMonthlyTimesheets } = useHrmTimesheetData();
  const { isHoliday, getHolidayName } = useTimesheetHolidays(dayjs(selectedMonth).year());
  const { isTravelDay, getTravelLabel } = useTimesheetTravel(dayjs(selectedMonth).year());

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
  // Mon→Sun weeks with at least one unsubmitted day, each carrying the days that caused it
  // (HRM issue #6: the banner used Sun→Sat weeks, so a leftover day from the previous
  // Mon–Sun week flagged the next one, and the message never said which day was pending).
  const unsubmittedWeeks = useMemo(() => {
    if (!atCurrentMonth) return [];
    return pendingSubmissionWeeks(monthlyTimesheets, selectedMonth, dayjs().format('YYYY-MM-DD'));
  }, [monthlyTimesheets, atCurrentMonth, selectedMonth]);

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
            title={atCurrentMonth ? 'Future months are not available' : 'Next month'}
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
          message={`Week-${unsubmittedWeeks.map((w) => w.week).join(', Week-')} timesheet(s) of ${dayjs(
            selectedMonth
          ).format('MMMM')} ${unsubmittedWeeks.length > 1 ? 'have' : 'has'} not been submitted.`}
          description={unsubmittedWeeks
            .map(
              (w) =>
                `Week-${w.week} (${dayjs(w.start).format('DD MMM')} – ${dayjs(w.end).format('DD MMM')}): ${w.days
                  .map((d) => dayjs(d).format('ddd DD MMM'))
                  .join(', ')} pending`
            )
            .join('; ')}
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
            {WEEKDAY_LABELS.map((d) => (
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
                // Editable only within the rolling window AND not in the future.
                const editable = isWithinTimesheetWindow(cell.date) && !future;
                const today = isToday(cell.date);
                const hours = ts?.totalHours ?? 0;
                const holiday = cell.inMonth && (isHoliday(cell.date) || !!ts?.holiday);
                const holidayName = getHolidayName(cell.date);
                const leave = cell.inMonth && !!ts?.leaveDay && !holiday;
                const travel = cell.inMonth && isTravelDay(cell.date);
                const travelLabel = getTravelLabel(cell.date);
                const weekend = cell.inMonth && isWeekendDate(cell.date);
                // Holiday, approved-leave, future, and out-of-window days are
                // all locked from entry.
                const clickable = cell.inMonth && editable && !holiday && !leave;
                const cellClass = [
                  styles.calCell,
                  !cell.inMonth ? styles.calCellOutMonth : '',
                  cell.inMonth && !editable ? styles.calCellFuture : '',
                  holiday ? styles.calHolidayCell : '',
                  leave ? styles.calLeaveCell : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <div
                    key={cell.date}
                    className={cellClass}
                    title={holiday ? holidayName : travel ? travelLabel : undefined}
                    onClick={() => clickable && openWeekForDate(cell.date)}
                  >
                    <div className={styles.calCellTop}>
                      <span className={`${styles.calDateNum} ${today ? styles.calDateToday : ''}`}>
                        {dayjs(cell.date).format('D')}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {travel && (
                          <span className={styles.travelIcon} title={travelLabel}>✈️</span>
                        )}
                        {holiday && <span title={holidayName}>🎉</span>}
                        {leave && <Tag color="orange" style={{ margin: 0 }}>Lve</Tag>}
                        {weekend && !holiday && !leave && (
                          <span className={styles.weekOffBadge}>W/O</span>
                        )}
                      </span>
                    </div>
                    {cell.inMonth && (
                      <>
                        {holiday ? (
                          <span className={styles.calHolidayLabel} title={holidayName}>
                            {holidayName || 'Holiday'}
                          </span>
                        ) : leave ? (
                          <span className={styles.calLeaveLabel}>
                            Leave{ts?.leaveType ? `: ${ts.leaveType}` : ''}
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
