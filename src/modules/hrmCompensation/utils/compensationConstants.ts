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
  { label: 'Percent of CTC', value: 'PERCENT_OF_CTC' },
  { label: 'Balance (absorbs the remainder)', value: 'BALANCE' },
  { label: 'Formula', value: 'FORMULA' },
];

export const PAY_FREQUENCY_OPTIONS = [
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Quarterly', value: 'QUARTERLY' },
  // Performance pay is half-yearly. Without this option it cannot be configured at all, and a
  // component left as MONTHLY would be added to every month's gross and printed on the payslip.
  { label: 'Half-yearly', value: 'HALF_YEARLY' },
  { label: 'Annual', value: 'ANNUAL' },
  { label: 'One Time', value: 'ONE_TIME' },
];

export const STATUTORY_LINKAGE_OPTIONS = [
  { label: 'None', value: 'NONE' },
  { label: 'Provident Fund (PF)', value: 'PF' },
  { label: 'ESI', value: 'ESI' },
  { label: 'Professional Tax (PT)', value: 'PT' },
];

/**
 * Grades are configured per site in R_HRM_EMPLOYEE_LOOKUP (lookupType=GRADE) and are fetched at
 * runtime — see useGradeOptions. The old hardcoded list is gone: once grade drives pay, a list that
 * silently diverges from the master produces wrong salaries.
 */

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
  PERCENT_OF_CTC: 'geekblue',
  BALANCE: 'gold',
  FORMULA: 'orange',
};

/** Shown instead of the raw enum, which reads badly on screen. */
export const CALC_METHOD_LABEL_MAP: Record<string, string> = {
  FIXED: 'Fixed',
  PERCENTAGE: '% of Base',
  PERCENT_OF_CTC: '% of CTC',
  BALANCE: 'Balance',
  FORMULA: 'Formula',
};
