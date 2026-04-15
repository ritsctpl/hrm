'use client';
import { Spin, Typography } from 'antd';
import dayjs from 'dayjs';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import DayColorIndicator from '../atoms/DayColorIndicator';
import TimesheetStatusBadge from '../atoms/TimesheetStatusBadge';
import type { DayColorCode, TimesheetStatus } from '../../types/domain.types';
import styles from '../../styles/HrmTimesheetGrid.module.css';

const { Text } = Typography;

export default function TeamTimesheetGrid() {
  const { teamTimesheets, selectedWeekStart, loadingTeam } = useHrmTimesheetStore();

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    weekDates.push(dayjs(selectedWeekStart).add(i, 'day').format('YYYY-MM-DD'));
  }

  if (loadingTeam) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Spin />
      </div>
    );
  }

  if (teamTimesheets.length === 0) {
    return (
      <div className={styles.gridWrapper}>
        <div style={{ padding: 32, textAlign: 'center', color: '#bfbfbf' }}>
          No team timesheet data for this week
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gridWrapper}>
      <table className={styles.grid}>
        <thead>
          <tr>
            <th className={styles.stickyColHeader}>Employee</th>
            {weekDates.map((d) => (
              <th key={d} className={styles.dayCell}>
                <div>{dayjs(d).format('ddd')}</div>
                <div style={{ fontWeight: 400, fontSize: 11 }}>{dayjs(d).format('D MMM')}</div>
              </th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {teamTimesheets.map((member) => {
            const totalHours = weekDates.reduce((s, date) => {
              const day = member.weeklyData.find((d) => d.date === date);
              return s + (day?.totalHours ?? 0);
            }, 0);
            return (
              <tr key={member.employeeId}>
                <td className={styles.stickyCol}>
                  <div>{member.employeeName}</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>{member.department}</div>
                </td>
                {weekDates.map((date) => {
                  const day = member.weeklyData.find((d) => d.date === date);
                  if (!day) {
                    return (
                      <td key={date} className={styles.dayCell}>
                        <span className={styles.dayCellEmpty}>—</span>
                      </td>
                    );
                  }
                  return (
                    <td key={date} className={styles.dayCell}>
                      <div
                        className={styles.dayCellInner}
                        style={day.colorCode ? { background: colorBg(day.colorCode) } : undefined}
                      >
                        <span className={styles.dayCellHours}>
                          {day.totalHours > 0 ? `${day.totalHours.toFixed(1)}h` : '—'}
                        </span>
                        {day.status && day.status !== 'EMPTY' && day.status !== 'DRAFT' && (
                          <TimesheetStatusBadge status={day.status as TimesheetStatus} />
                        )}
                        {day.colorCode && day.colorCode !== 'GREY' && (
                          <DayColorIndicator colorCode={day.colorCode as DayColorCode} size="sm" />
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className={styles.totalCell}>
                  <Text strong>{totalHours.toFixed(1)}h</Text>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function colorBg(code: string): string {
  const map: Record<string, string> = {
    GREEN: '#f6ffed',
    YELLOW: '#fffbe6',
    RED: '#fff1f0',
    GREY: 'transparent',
  };
  return map[code] ?? 'transparent';
}
