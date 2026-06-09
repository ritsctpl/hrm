// src/modules/hrmTimesheet/types/ui.types.ts
import type { TimesheetHeader, TimesheetLine, DayColorCode, TimesheetStatus } from './domain.types';

export type TimesheetMainTab = 'my' | 'employees' | 'reports';
export type ReportTab = 'payroll' | 'compliance' | 'unplanned' | 'holiday' | 'categories' | 'lockPeriods';

/** Manager "Employee Timesheets" dashboard status pills. */
export type ManagerStatusFilter =
  | 'ALL'
  | 'FOR_APPROVAL'
  | 'REJECTED'
  | 'BLOCKED'
  | 'ENABLED'
  | 'APPROVED';

/** Reporting scope for the manager dashboard. `all` includes indirect (2nd-level) reports — backend-dependent. */
export type ManagerScope = 'direct' | 'all';

/** The employee whose timesheet a manager is reviewing in the drill-down. */
export interface ManagerTargetEmployee {
  employeeId: string;
  employeeName: string;
  department?: string;
}

export interface WeekDaySummary {
  date: string;
  dayLabel: string;
  totalHours: number;
  colorCode: DayColorCode;
  status: TimesheetStatus | 'EMPTY';
  isHoliday: boolean;
  isLeave: boolean;
  timesheetHandle?: string;
}

export interface TimesheetLineFormValues {
  lineId: string;
  lineType: 'PROJECT' | 'UNPLANNED' | 'LEAVE' | 'HOLIDAY_WORKING';
  allocationHandle?: string;
  projectCode?: string;
  projectName?: string;
  hours: number;
  categoryId?: string;
  reason?: string;
  notes?: string;
}

/** A line as edited in the weekly matrix, ready to send to /save. */
export interface MatrixLineInput {
  lineType: TimesheetLine['lineType'];
  projectHandle?: string;
  allocationHandle?: string;
  taskId?: string;
  categoryId?: string;
  hours: number;
  reason?: string;
  notes?: string;
}

export interface DayColorIndicatorProps {
  colorCode: DayColorCode;
  size?: 'sm' | 'md' | 'lg';
}

export interface TimesheetStatusBadgeProps {
  status: TimesheetStatus;
}

export interface HoursDisplayProps {
  hours: number;
  colorCode?: DayColorCode;
  bold?: boolean;
}
