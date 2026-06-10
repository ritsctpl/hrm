'use client';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import EmployeeTimesheetsDashboard from '../organisms/EmployeeTimesheetsDashboard';
import EmployeeTimesheetReview from '../organisms/EmployeeTimesheetReview';

/**
 * "Employee Timesheets" manager workflow: a roster dashboard (Screen 3) that
 * drills into a per-employee review (Screen 4) on "View Time".
 */
export default function TimesheetManagerTemplate() {
  const managerViewMode = useHrmTimesheetStore((s) => s.managerViewMode);
  return managerViewMode === 'detail' ? <EmployeeTimesheetReview /> : <EmployeeTimesheetsDashboard />;
}
