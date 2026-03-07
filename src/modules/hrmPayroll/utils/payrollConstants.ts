import type { AdjustmentType } from '../types/api.types';
import type { PayrollRunStatus, PayrollEntryStatus } from '../types/domain.types';

export const PAYROLL_MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const WIZARD_STEPS = [
  'Select Month',
  'Select Group',
  'Review Inputs',
  'Process',
  'Review Results',
  'Approve & Lock',
] as const;

export const ADJUSTMENT_TYPES: { value: AdjustmentType; label: string }[] = [
  { value: 'BONUS', label: 'Bonus' },
  { value: 'INCENTIVE', label: 'Incentive' },
  { value: 'REIMBURSEMENT', label: 'Reimbursement' },
  { value: 'DEDUCTION', label: 'Deduction' },
  { value: 'ARREAR', label: 'Arrear' },
  { value: 'OTHER', label: 'Other' },
];

export const PAYROLL_STATUS_COLORS: Record<PayrollRunStatus, string> = {
  DRAFT: 'default',
  VALIDATED: 'processing',
  APPROVED: 'warning',
  FINALIZED: 'success',
  PUBLISHED: 'blue',
};

export const ENTRY_STATUS_COLORS: Record<PayrollEntryStatus, string> = {
  COMPUTED: 'success',
  ERROR: 'error',
  ADJUSTED: 'warning',
  LOCKED: 'default',
};

export const PIPELINE_STEPS: PayrollRunStatus[] = [
  'DRAFT',
  'VALIDATED',
  'APPROVED',
  'FINALIZED',
  'PUBLISHED',
];

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Karnataka',
  'Kerala',
  'Maharashtra',
  'Tamil Nadu',
  'Telangana',
  'West Bengal',
  'Gujarat',
  'Rajasthan',
  'Uttar Pradesh',
  'Punjab',
  'Haryana',
  'Delhi',
  'Madhya Pradesh',
  'Bihar',
  'Odisha',
] as const;

export const VARIANCE_THRESHOLD_WARNING = 10;
export const VARIANCE_THRESHOLD_ERROR = 20;
