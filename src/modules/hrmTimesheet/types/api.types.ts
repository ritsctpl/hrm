// src/modules/hrmTimesheet/types/api.types.ts

export interface TimesheetRequest {
  organizationId: string;
  employeeId: string;
  date: string;
  lines: TimesheetLineRequest[];
  notes?: string;
  createdBy: string;
}

export interface TimesheetLineRequest {
  lineType: 'PROJECT' | 'ALLOCATED' | 'UNPLANNED' | 'LEAVE' | 'HOLIDAY_WORKING';
  projectHandle?: string;
  allocationHandle?: string;
  hours: number;
  categoryId?: string;
  reason?: string;
  notes?: string;
}

export interface TimesheetResponse {
  handle: string;
  site: string;
  employeeId: string;
  employeeName: string;
  department: string;
  buCode: string;
  supervisorId: string;
  date: string;
  lines: TimesheetLineResponse[];
  totalHours: number;
  colorCode: 'GREEN' | 'YELLOW' | 'RED';
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REOPENED';
  notes?: string;
  version: number;
  holiday: boolean;
  leaveDay: boolean;
  leaveType?: string;
  active: number;
  createdDateTime: string;
  modifiedDateTime: string;
  createdBy: string;
  modifiedBy: string;
}

export interface TimesheetLineResponse {
  lineId: string;
  lineType: string;
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

export interface WeeklyTimesheetResponse {
  employeeId: string;
  employeeName: string;
  weekStartDate: string;
  weekEndDate: string;
  dailyTimesheets: TimesheetResponse[];
  weeklyTotalHours: number;
  greenDays: number;
  yellowDays: number;
  redDays: number;
  submittedDays: number;
  pendingDays: number;
}

export interface TimesheetSubmitRequest {
  organizationId: string;
  employeeId: string;
  timesheetHandle: string;
  submittedBy: string;
}

export interface WeeklyBulkSubmitRequest {
  organizationId: string;
  employeeId: string;
  weekStartDate: string;
  submittedBy: string;
}

export interface BulkSubmitResponse {
  totalDays: number;
  submittedDays: number;
  skippedDays: number;
  errors: string[];
}

export interface TimesheetApprovalRequest {
  organizationId: string;
  timesheetHandle: string;
  action: 'APPROVED' | 'REJECTED';
  remarks?: string;
  approverEmployeeId: string;
  approverName?: string;
}

export interface BulkTimesheetApprovalRequest {
  organizationId: string;
  timesheetHandles: string[];
  action: 'APPROVED' | 'REJECTED';
  remarks?: string;
  approverEmployeeId: string;
  approverName?: string;
}

export interface BulkApprovalResponse {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

export interface TimesheetReopenRequest {
  organizationId: string;
  timesheetHandle: string;
  reopenedBy: string;
  reason: string;
}

export interface TeamTimesheetSummaryResponse {
  employeeId: string;
  employeeName: string;
  department: string;
  weeklyData: {
    date: string;
    totalHours: number;
    colorCode: 'GREEN' | 'YELLOW' | 'RED' | 'GREY';
    status: string;
    timesheetHandle?: string;
  }[];
}

export interface UnplannedCategoryResponse {
  handle: string;
  site: string;
  label: string;
  description?: string;
  displayOrder: number;
  active: number;
  createdDateTime?: string;
  createdBy?: string;
}

export interface PayrollExportRow {
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  totalHours: number;
  allocatedHours: number;
  unplannedHours: number;
  leaveHours: number;
  holidayWorkingHours: number;
}

export interface SubmissionComplianceReport {
  periodStart: string;
  periodEnd: string;
  workingDays: number;
  overallCompliancePercent: number;
  employeeCompliance: {
    employeeId: string;
    employeeName: string;
    workingDays: number;
    submittedDays: number;
    approvedDays: number;
    compliancePercent: number;
    greenDays: number;
    yellowDays: number;
    redDays: number;
  }[];
}

export interface UnplannedWorkReport {
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  unplannedHours: number;
  unplannedPercent: number;
  byCategory: {
    categoryId: string;
    categoryLabel: string;
    hours: number;
    percent: number;
  }[];
  byEmployee: {
    employeeId: string;
    employeeName: string;
    totalHours: number;
    unplannedHours: number;
    unplannedPercent: number;
  }[];
}

export interface HolidayWorkingSummary {
  periodStart: string;
  periodEnd: string;
  entries: {
    employeeId: string;
    employeeName: string;
    date: string;
    holidayName: string;
    hoursWorked: number;
    projectCode?: string;
  }[];
}

// ─── Lock Period Types ───────────────────────────────────────────────────────

export interface TimesheetLockPeriodRequest {
  organizationId: string;
  lockDate: string;
  reason?: string;
  createdBy: string;
}

export interface TimesheetLockPeriodResponse {
  handle: string;
  organizationId: string;
  lockDate: string;
  reason?: string;
  active: number;
  createdDateTime: string;
  modifiedDateTime: string;
  createdBy: string;
  modifiedBy: string;
}
