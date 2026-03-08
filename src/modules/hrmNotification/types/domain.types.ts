/**
 * HRM Notification Module - Domain Types
 */

export type NotificationType =
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'LEAVE_SUBMITTED'
  | 'EXPENSE_SUBMITTED'
  | 'EXPENSE_APPROVED'
  | 'PAYROLL_PUBLISHED'
  | 'PAYSLIP_READY'
  | 'ASSET_ALLOCATED'
  | 'ANNOUNCEMENT'
  | 'APPRAISAL_DUE'
  | 'POLICY_PUBLISHED'
  | 'TIMESHEET_REMINDER'
  | 'SYSTEM';

export interface Notification {
  id: string;
  site: string;
  recipientId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
