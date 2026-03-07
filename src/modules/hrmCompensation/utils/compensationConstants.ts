/**
 * HRM Compensation Module — Constants
 */

export const COMPONENT_TYPE_OPTIONS = [
  { label: 'Earning', value: 'EARNING' },
  { label: 'Deduction', value: 'DEDUCTION' },
];

export const SUB_TYPE_OPTIONS = [
  { label: 'Fixed', value: 'FIXED' },
  { label: 'Variable', value: 'VARIABLE' },
  { label: 'Reimbursement', value: 'REIMBURSEMENT' },
  { label: 'Statutory', value: 'STATUTORY' },
];

export const CALC_METHOD_OPTIONS = [
  { label: 'Fixed Amount', value: 'FIXED' },
  { label: 'Percentage of Base', value: 'PERCENTAGE' },
  { label: 'Formula', value: 'FORMULA' },
];

export const PAY_FREQUENCY_OPTIONS = [
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Quarterly', value: 'QUARTERLY' },
  { label: 'Annual', value: 'ANNUAL' },
  { label: 'One Time', value: 'ONE_TIME' },
];

export const STATUTORY_LINKAGE_OPTIONS = [
  { label: 'None', value: 'NONE' },
  { label: 'Provident Fund (PF)', value: 'PF' },
  { label: 'ESI', value: 'ESI' },
  { label: 'Professional Tax (PT)', value: 'PT' },
];

export const GRADE_OPTIONS = [
  { label: 'Junior', value: 'JUNIOR' },
  { label: 'Staff', value: 'STAFF' },
  { label: 'Senior', value: 'SENIOR' },
  { label: 'Manager', value: 'MANAGER' },
  { label: 'Executive', value: 'EXECUTIVE' },
  { label: 'Director', value: 'DIRECTOR' },
];

export const TAB_LABELS: Record<string, string> = {
  components: 'Pay Components',
  structures: 'Salary Structures',
  assignment: 'Assignment',
  revision: 'Revision',
};

export const STATUS_COLOR_MAP: Record<string, string> = {
  DRAFT: 'default',
  SUBMITTED: 'processing',
  APPROVED: 'success',
  REJECTED: 'error',
};

export const CALC_METHOD_COLOR_MAP: Record<string, string> = {
  FIXED: 'blue',
  PERCENTAGE: 'purple',
  FORMULA: 'orange',
};
