'use client';
import { useEffect } from 'react';
import { Button, Select, Space, Spin, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectData } from '../../hooks/useProjectData';
import CapacityColorDot from '../atoms/CapacityColorDot';
import type { CapacityStatus } from '../../types/domain.types';
import styles from '../../styles/ResourceCalendar.module.css';

export default function ResourceCalendarView() {
  const { calendarWeekStart, setCalendarWeekStart, calendarBU, setCalendarBU, calendarDept, setCalendarDept, calendarData, loadingCalendar } = useHrmProjectStore();
  const { loadCalendar } = useProjectData();

  useEffect(() => {
    loadCalendar();
  }, [calendarWeekStart, calendarBU, calendarDept]);

  const weekDates = Array.from({ length: 7 }, (_, i) =>
    dayjs(calendarWeekStart).add(i, 'day').format('YYYY-MM-DD')
  );

  const prevWeek = () => setCalendarWeekStart(dayjs(calendarWeekStart).subtract(7, 'day').format('YYYY-MM-DD'));
  const nextWeek = () => setCalendarWeekStart(dayjs(calendarWeekStart).add(7, 'day').format('YYYY-MM-DD'));

  return (
    <div className={styles.calendarContainer}>
      <Space className={styles.calendarControls} wrap>
        <Button icon={<LeftOutlined />} onClick={prevWeek} />
        <span className={styles.weekLabel}>
          {dayjs(calendarWeekStart).format('DD MMM')} — {dayjs(calendarWeekStart).add(6, 'day').format('DD MMM YYYY')}
        </span>
        <Button icon={<RightOutlined />} onClick={nextWeek} />
        <Select placeholder="BU" value={calendarBU || undefined} onChange={setCalendarBU} allowClear style={{ width: 120 }} />
        <Select placeholder="Department" value={calendarDept || undefined} onChange={setCalendarDept} allowClear style={{ width: 140 }} />
      </Space>

      {loadingCalendar ? (
        <Spin />
      ) : (
        <div className={styles.grid}>
          <div className={`${styles.gridRow} ${styles.gridHeader}`}>
            <div className={styles.employeeCell}>Employee</div>
            {weekDates.map((d) => (
              <div key={d} className={styles.dayHeaderCell}>
                <div>{dayjs(d).format('ddd')}</div>
                <div>{dayjs(d).format('D')}</div>
              </div>
            ))}
          </div>
          {calendarData.map((emp) => (
            <div key={emp.employeeId} className={styles.gridRow}>
              <div className={styles.employeeCell}>
                <div className={styles.empName}>{emp.employeeName}</div>
                <div className={styles.empDept}>{emp.department}</div>
              </div>
              {weekDates.map((d) => {
                const day = emp.days.find((x) => x.date === d);
                if (!day) return <div key={d} className={styles.dayCellEmpty} />;
                const status: CapacityStatus = day.isHoliday || day.isLeave ? 'GREY' : day.capacityStatus;
                const label = day.isHoliday ? 'HOL' : day.isLeave ? 'LVE' : `${day.allocatedHours.toFixed(1)}h`;
                return (
                  <Tooltip key={d} title={`${d}: ${label}`}>
                    <div className={styles.dayCell}>
                      <CapacityColorDot status={status} size={8} />
                      <span className={styles.dayCellHours}>{label}</span>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          ))}
          {calendarData.length === 0 && (
            <div className={styles.emptyCalendar}>No data available</div>
          )}
        </div>
      )}

      <div className={styles.legend}>
        <CapacityColorDot status="GREEN" /> <span>Available</span>
        <CapacityColorDot status="YELLOW" /> <span>90–100%</span>
        <CapacityColorDot status="RED" /> <span>Exceeds</span>
        <CapacityColorDot status="GREY" /> <span>Holiday / Leave</span>
      </div>
    </div>
  );
}
