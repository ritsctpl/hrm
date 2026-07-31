import { APP_URL_TO_MODULE } from '../../hrmAccess/utils/moduleObjectRegistry';
import type { GuideAudience, GuideStatus } from '../types/domain.types';

/** Backend base path — leading slash, no `app/v1/` (the Axios baseURL has it). */
export const USER_GUIDE_BASE = '/hrm-service/userguide';

export const MODULE_CODE = 'HRM_USER_GUIDE';

/** Only PDFs — a guide is a document, not an arbitrary attachment. */
export const ACCEPTED_FILE_TYPES = '.pdf';
export const ACCEPTED_MIME = 'application/pdf';
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

/**
 * Display names for the modules a guide can document. Derived from the RBAC
 * registry so a newly-registered module automatically becomes a valid target;
 * the label map only supplies prettier names than the raw code.
 */
const MODULE_LABELS: Record<string, string> = {
  HRM_ACCESS: 'Access Control',
  HRM_ANNOUNCEMENT: 'Announcements',
  HRM_APPRAISAL: 'Performance Appraisal',
  HRM_ASSET: 'Asset Management',
  HRM_COMPENSATION: 'Compensation',
  HRM_DASHBOARD: 'Dashboard',
  HRM_EMPLOYEE: 'Employee Master',
  HRM_EXPENSE: 'Expense Reports',
  HRM_GRADE: 'Grades & Designations',
  HRM_HOLIDAY: 'Holiday Calendar',
  HRM_LEAVE: 'Leave Management',
  HRM_NOTIFICATION: 'Notifications',
  HRM_ORGANIZATION: 'Organization Setup',
  HRM_PAYROLL: 'Payroll Processing',
  HRM_PAYSLIP: 'Payslips',
  HRM_POLICY: 'HR Policies',
  HRM_PROJECT: 'Projects & Resources',
  HRM_SETTINGS: 'Settings',
  HRM_TIMESHEET: 'Timesheet',
  HRM_TRAVEL: 'Travel Requests',
  HRM_USER_GUIDE: 'User Guides',
};

/** Every module code that can be the target of a guide, label-sorted. */
export const GUIDE_TARGET_MODULES: { code: string; label: string }[] = Array.from(
  new Set([...Object.values(APP_URL_TO_MODULE), MODULE_CODE]),
)
  .map((code) => ({ code, label: MODULE_LABELS[code] ?? code }))
  .sort((a, b) => a.label.localeCompare(b.label));

export function moduleLabel(moduleCode: string): string {
  return MODULE_LABELS[moduleCode] ?? moduleCode;
}

export const STATUS_OPTIONS: { value: GuideStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export const AUDIENCE_OPTIONS: { value: GuideAudience; label: string }[] = [
  { value: 'ALL', label: 'All employees' },
  { value: 'ADMIN', label: 'Admins only' },
];

export const STATUS_COLORS: Record<GuideStatus, string> = {
  DRAFT: 'default',
  PUBLISHED: 'green',
  ARCHIVED: 'red',
};
