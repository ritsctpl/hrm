'use client';
import { Divider, Spin } from 'antd';
import { useEffect } from 'react';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import { useHrmTimesheetData } from '../../hooks/useHrmTimesheetData';
import { useHrmTimesheetUI } from '../../hooks/useHrmTimesheetUI';
import WeekCalendarBar from '../organisms/WeekCalendarBar';
import DailyTimesheetEditor from '../organisms/DailyTimesheetEditor';
import WeeklySubmitPanel from '../organisms/WeeklySubmitPanel';

export default function TimesheetEmployeeTemplate() {
  const { selectedDate, selectedWeekStart, weeklyTimesheets, loadingWeek, loadingDay } =
    useHrmTimesheetStore();
  const { loadWeeklyTimesheets, loadDayTimesheet } = useHrmTimesheetData();
  const { saveTimesheet, submitTimesheet, copyFromPreviousDay, submitWeek } = useHrmTimesheetUI();

  useEffect(() => {
    void loadWeeklyTimesheets();
  }, [selectedWeekStart, loadWeeklyTimesheets]);

  useEffect(() => {
    void loadDayTimesheet(selectedDate);
  }, [selectedDate, loadDayTimesheet]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <WeekCalendarBar weeklyTimesheets={weeklyTimesheets} loading={loadingWeek} />

      <div style={{ padding: 16 }}>
        {loadingDay ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : (
          <DailyTimesheetEditor
            onSave={saveTimesheet}
            onSubmit={submitTimesheet}
            onCopyFromPrev={copyFromPreviousDay}
          />
        )}

        <Divider style={{ margin: '20px 0' }} />

        <WeeklySubmitPanel onSubmitWeek={submitWeek} />
      </div>
    </div>
  );
}
