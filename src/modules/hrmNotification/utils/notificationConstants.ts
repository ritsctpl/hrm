/**
 * HRM Notification Module - Constants
 */

import type { NotificationType } from '../types/domain.types';

export const TYPE_COLOR_MAP: Record<string, string> = {
  LEAVE_APPROVED: '#52c41a',
  LEAVE_REJECTED: '#ff4d4f',
  EXPENSE_SUBMITTED: '#faad14',
  EXPENSE_APPROVED: '#52c41a',
  PAYROLL_PUBLISHED: '#1890ff',
  PAYSLIP_READY: '#1890ff',
  ASSET_ALLOCATED: '#722ed1',
  ANNOUNCEMENT: '#fa8c16',
  APPRAISAL_DUE: '#eb2f96',
  POLICY_PUBLISHED: '#13c2c2',
  LEAVE_SUBMITTED: '#faad14',
  TIMESHEET_REMINDER: '#fa8c16',
  SYSTEM: '#8c8c8c',
};

export const TYPE_LABEL_MAP: Record<string, string> = {
  LEAVE_APPROVED: 'Leave Approved',
  LEAVE_REJECTED: 'Leave Rejected',
  EXPENSE_SUBMITTED: 'Expense Submitted',
  EXPENSE_APPROVED: 'Expense Approved',
  PAYROLL_PUBLISHED: 'Payroll Published',
  PAYSLIP_READY: 'Payslip Ready',
  ASSET_ALLOCATED: 'Asset Allocated',
  ANNOUNCEMENT: 'Announcement',
  APPRAISAL_DUE: 'Appraisal Due',
  POLICY_PUBLISHED: 'Policy Published',
  LEAVE_SUBMITTED: 'Leave Submitted',
  TIMESHEET_REMINDER: 'Timesheet Reminder',
  SYSTEM: 'System',
};

export const NOTIFICATION_TYPE_OPTIONS = Object.entries(TYPE_LABEL_MAP).map(
  ([value, label]) => ({ value, label })
);

export const PAGE_SIZE = 20;
export const POLLING_INTERVAL_MS = 60_000;
