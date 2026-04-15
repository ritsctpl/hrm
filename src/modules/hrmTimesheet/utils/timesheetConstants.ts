// src/modules/hrmTimesheet/utils/timesheetConstants.ts

export const TIMESHEET_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  SUBMITTED: 'processing',
  APPROVED: 'success',
  REJECTED: 'error',
  REOPENED: 'warning',
};

export const DAY_COLOR_STYLES: Record<string, { background: string; border: string; text: string }> = {
  GREEN: { background: '#f6ffed', border: '#b7eb8f', text: '#52c41a' },
  YELLOW: { background: '#fffbe6', border: '#ffe58f', text: '#faad14' },
  RED: { background: '#fff1f0', border: '#ffa39e', text: '#ff4d4f' },
  GREY: { background: '#fafafa', border: '#d9d9d9', text: '#8c8c8c' },
};

export const LINE_TYPE_LABELS: Record<string, string> = {
  PROJECT: 'Allocated',
  ALLOCATED: 'Allocated',
  UNPLANNED: 'Unplanned',
  LEAVE: 'Leave',
  HOLIDAY_WORKING: 'Holiday Working',
};

export const HOURS_STEP = 0.5;
export const MAX_HOURS_PER_DAY = 24;
export const GREEN_THRESHOLD = 9;
export const YELLOW_THRESHOLD = 6;

export const REPORT_TABS = [
  { key: 'payroll', label: 'Payroll Export' },
  { key: 'compliance', label: 'Submission Compliance' },
  { key: 'unplanned', label: 'Unplanned Work' },
  { key: 'holiday', label: 'Holiday Working' },
  { key: 'categories', label: 'Unplanned Categories' },
  { key: 'lockPeriods', label: 'Lock Periods' },
];
