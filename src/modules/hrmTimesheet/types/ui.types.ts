// src/modules/hrmTimesheet/types/ui.types.ts
import type { TimesheetHeader, TimesheetLine, DayColorCode, TimesheetStatus } from './domain.types';

export type TimesheetMainTab = 'my' | 'approvals' | 'team' | 'reports';
export type ReportTab = 'payroll' | 'compliance' | 'unplanned' | 'holiday';

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
  lineType: 'ALLOCATED' | 'UNPLANNED' | 'LEAVE' | 'HOLIDAY_WORKING';
  allocationHandle?: string;
  projectCode?: string;
  projectName?: string;
  hours: number;
  categoryId?: string;
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
