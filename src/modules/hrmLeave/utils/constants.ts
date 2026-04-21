export const LEAVE_TYPE_COLORS: Record<string, string> = {
  CL: "#1890ff",
  SL: "#52c41a",
  PL: "#722ed1",
  CO: "#fa8c16",
  WFH: "#13c2c2",
};

export const LEAVE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "default",
  PENDING_SUPERVISOR: "orange",
  PENDING_NEXT_SUPERIOR: "gold",
  PENDING_HR: "blue",
  APPROVED: "green",
  REJECTED: "red",
  CANCELLED: "default",
  ESCALATED: "volcano",
};

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_SUPERVISOR: "Pending Supervisor",
  PENDING_NEXT_SUPERIOR: "Pending Next Superior",
  PENDING_HR: "Pending HR",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  ESCALATED: "Escalated",
};

export const ACCRUAL_FREQUENCIES = [
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "MANUAL", label: "Manual" },
  { value: "ANNUAL", label: "Annual" },
];

export const LAPSE_RULES = [
  { value: "ALL", label: "All" },
  { value: "PARTIAL", label: "Partial" },
  { value: "NONE", label: "None" },
];

export const ENCASH_WHEN_OPTIONS = [
  { value: "YEAR_END", label: "Year End" },
  { value: "SEPARATION", label: "Separation" },
  { value: "ON_DEMAND", label: "On Demand" },
];

export const ENCASH_RATE_FORMULAS = [
  { value: "BASIC_PER_26", label: "Basic / 26" },
  { value: "CTC_PER_30", label: "CTC / 30" },
];

export const ROLE_VIEWS = {
  EMPLOYEE: "EMPLOYEE",
  SUPERVISOR: "SUPERVISOR",
  NEXT_SUPERIOR: "NEXT_SUPERIOR",
  HR: "HR",
  ADMIN: "ADMIN",
  SUPERADMIN: "SUPERADMIN",
};

export const HR_ROLES = ["HR", "ADMIN", "SUPERADMIN"];
export const SUPERVISOR_ROLES = ["SUPERVISOR", "NEXT_SUPERIOR"];

export const DAY_TYPE_LABELS: Record<string, string> = {
  FULL: "Full Day",
  FIRST_HALF: "First Half (AM)",
  SECOND_HALF: "Second Half (PM)",
};

export const LEAVE_CATEGORIES = [
  { value: "STANDARD", label: "Standard" },
  { value: "SPECIAL", label: "Special" },
];

export const DIRECTION_COLORS: Record<string, string> = {
  CR: "green",
  DR: "red",
};

export const ESCALATION_LEVEL_LABELS: Record<number, string> = {
  0: "Level 0",
  1: "Level 1",
  2: "Level 2",
};

export const SLA_WARNING_HOURS = 4;
export const SLA_CRITICAL_HOURS = 1;

export const VALIDATION_STATE_LABELS: Record<string, string> = {
  eligible: "Eligible",
  insufficient_balance: "Insufficient Balance",
  overlap_detected: "Overlap Detected",
  requires_hr_review: "Requires HR Review",
  insufficient_notice: "Insufficient Notice",
  below_minimum: "Below Minimum",
  exceeds_maximum: "Exceeds Maximum",
  probation_restricted: "Probation Restricted",
  gender_restricted: "Not Applicable",
  backdated_requires_hr: "Backdated — HR Review",
  clubbing_violation: "Clubbing Violation",
  blackout_period: "Blackout Period",
};

export const LEDGER_REF_TYPE_LABELS: Record<string, string> = {
  ACCRUAL: "Accrual",
  LEAVE: "Leave Availed",
  ADJUST: "Manual Adjustment",
  CARRY: "Carry Forward",
  LAPSE: "Lapsed",
  ENCASH: "Encashed",
  CO: "Comp Off",
  WFH: "Work From Home",
};
