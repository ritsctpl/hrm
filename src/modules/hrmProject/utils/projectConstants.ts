import type { ProjectStatus, AllocationStatus, MilestoneStatus, CapacityStatus } from '../types/domain.types';

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'INITIATED', label: 'Initiated' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  INITIATED: 'cyan',
  DRAFT: 'default',
  IN_PROGRESS: 'success',
  ON_HOLD: 'warning',
  COMPLETED: 'blue',
  CANCELLED: 'error',
};

export const ALLOCATION_STATUS_COLORS: Record<AllocationStatus, string> = {
  DRAFT: 'default',
  SUBMITTED: 'processing',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'default',
};

export const MILESTONE_STATUS_COLORS: Record<MilestoneStatus, string> = {
  NOT_STARTED: 'default',
  IN_PROGRESS: 'processing',
  COMPLETED: 'success',
  DELAYED: 'error',
};

export const CAPACITY_COLORS: Record<CapacityStatus, string> = {
  GREEN: '#52c41a',
  YELLOW: '#faad14',
  RED: '#ff4d4f',
  GREY: '#d9d9d9',
};

export const ALLOCATION_STATUS_OPTIONS: { value: AllocationStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const REPORT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'projectHealth', label: 'Project Health' },
  { value: 'resourceWorkload', label: 'Resource Workload' },
  { value: 'allocationVsActual', label: 'Allocation vs Actual' },
  { value: 'utilization', label: 'Resource Utilization' },
  { value: 'capacityDemand', label: 'Capacity Demand' },
];

export const PROJECT_TYPES = [
  { value: 'BILLABLE', label: 'Billable' },
  { value: 'NON_BILLABLE', label: 'Non-Billable' },
  { value: 'REVENUE_GENERATION', label: 'Revenue Generation' },
];

/** Currencies supported for client billing. */
export const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'AED', label: 'AED — UAE Dirham' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
];

export const RECURRENCE_PATTERNS = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

/** ISO day-of-week values per backend contract (1=Mon … 7=Sun). */
export const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

export const BOOKING_TYPES = [
  { value: 'FIRM', label: 'Firm' },
  { value: 'TENTATIVE', label: 'Tentative' },
];

/** Booked task-work hours may exceed the project estimate up to this %; beyond → blocked. */
export const ALLOCATION_OVER_THRESHOLD_PCT = 120;

export const MAX_HOURS_PER_DAY = 9.0;
export const MIN_HOURS_PER_DAY = 0.5;
export const HOURS_STEP = 0.5;

export const CAPACITY_THRESHOLD_YELLOW = 90;
