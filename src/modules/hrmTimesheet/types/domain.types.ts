// src/modules/hrmTimesheet/types/domain.types.ts

export type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REOPENED';
export type DayColorCode = 'GREEN' | 'YELLOW' | 'RED' | 'GREY';
export type LineType = 'PROJECT' | 'ALLOCATED' | 'UNPLANNED' | 'LEAVE' | 'HOLIDAY_WORKING';

export interface TimesheetLine {
  lineId: string;
  lineType: LineType;
  projectHandle?: string;
  projectCode?: string;
  projectName?: string;
  allocationHandle?: string;
  hours: number;
  categoryId?: string;
  categoryLabel?: string;
  reason?: string;
  notes?: string;
  allocatedHoursForDay?: number;
  overrun: boolean;
}

export interface TimesheetHeader {
  handle: string;
  site: string;
  employeeId: string;
  employeeName: string;
  department: string;
  buCode: string;
  supervisorId: string;
  date: string;
  lines: TimesheetLine[];
  totalHours: number;
  colorCode: DayColorCode;
  status: TimesheetStatus;
  notes?: string;
  version: number;
  holiday: boolean;
  leaveDay: boolean;
  leaveType?: string;
  active: number;
  createdDateTime: string;
  modifiedDateTime: string;
}

export interface WeeklyTimesheetSummary {
  employeeId: string;
  employeeName: string;
  weekStartDate: string;
  weekEndDate: string;
  dailyTimesheets: TimesheetHeader[];
  weeklyTotalHours: number;
  greenDays: number;
  yellowDays: number;
  redDays: number;
  submittedDays: number;
  pendingDays: number;
}

export interface TeamTimesheetDay {
  date: string;
  totalHours: number;
  colorCode: DayColorCode;
  status: string;
  timesheetHandle?: string;
}

export interface TeamTimesheetSummary {
  employeeId: string;
  employeeName: string;
  department: string;
  weeklyData: TeamTimesheetDay[];
}

export interface UnplannedCategory {
  handle: string;
  site: string;
  label: string;
  description?: string;
  displayOrder: number;
  active: number;
}

export interface TimesheetApproval {
  handle: string;
  timesheetHandle: string;
  approverEmployeeId: string;
  approverName: string;
  action: 'APPROVED' | 'REJECTED';
  remarks?: string;
  actionDateTime: string;
}

export interface AllocationForDay {
  allocationHandle: string;
  projectHandle: string;
  projectCode: string;
  projectName: string;
  allocatedHoursForDay: number;
}
