'use client';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import MonthlyCalendarView from '../organisms/MonthlyCalendarView';
import WeeklyMatrixGrid from '../organisms/WeeklyMatrixGrid';

export default function TimesheetEmployeeTemplate() {
  const myViewMode = useHrmTimesheetStore((s) => s.myViewMode);

  // PRD: monthly calendar is the landing; clicking a date drills into the
  // weekly project×day matrix for that week.
  return myViewMode === 'week' ? <WeeklyMatrixGrid /> : <MonthlyCalendarView />;
}
