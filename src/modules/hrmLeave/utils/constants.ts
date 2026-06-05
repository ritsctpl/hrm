export const LEAVE_TYPE_COLORS: Record<string, string> = {
  CL: "#1890ff",
  SL: "#52c41a",
  PL: "#722ed1",
  CO: "#fa8c16",
  WFH: "#13c2c2",
};

/** Fallback palette for leave type codes that are not in LEAVE_TYPE_COLORS.
 *  Org-configured codes (EL, ML, PAT, LWP, BL, …) used to fall back to a
 *  single gray; instead we pick a stable, distinct color per code so every
 *  leave type renders in colour. */
export const LEAVE_TYPE_COLOR_PALETTE: string[] = [
  "#eb2f96", // magenta
  "#2f54eb", // geekblue
  "#a0d911", // lime
  "#fa541c", // volcano
  "#faad14", // gold
  "#08979c", // cyan-dark
  "#531dab", // purple-dark
  "#c41d7f", // magenta-dark
  "#d4380d", // red-dark
  "#7cb305", // lime-dark
  "#096dd9", // blue-dark
  "#d48806", // gold-dark
];

/** Deterministic hash → palette index. Same code always yields the same
 *  colour across renders and sessions. */
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // force 32-bit int
  }
  return Math.abs(hash);
};

/** Resolve a colour for a leave type code: the well-known mapping when present,
 *  otherwise a stable colour derived from the code. Never returns the old gray
 *  default unless the code is empty. */
export const getLeaveTypeColor = (code?: string | null): string => {
  if (!code) return "#8c8c8c";
  const known = LEAVE_TYPE_COLORS[code] ?? LEAVE_TYPE_COLORS[code.toUpperCase()];
  if (known) return known;
  return LEAVE_TYPE_COLOR_PALETTE[hashCode(code) % LEAVE_TYPE_COLOR_PALETTE.length];
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

// Leave Policy applicability options. A policy applies to an employee when
// the gender / employee-type / designation either match or are left as
// "ALL"/unset on the policy.
export const GENDER_APPLICABILITY = [
  { value: "ALL", label: "All" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

export const EMPLOYEE_TYPE_OPTIONS = [
  { value: "PERMANENT", label: "Permanent" },
  { value: "CONTRACT", label: "Contract" },
  { value: "PROBATION", label: "Probation" },
  { value: "INTERN", label: "Intern" },
  { value: "CONSULTANT", label: "Consultant" },
  { value: "PART_TIME", label: "Part Time" },
];

// Policy applicability — marital status. Drives Maternity / Paternity
// eligibility (only married female / married male respectively).
export const MARITAL_STATUS_APPLICABILITY = [
  { value: "ALL", label: "All" },
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
];

/** Detect Maternity / Paternity leave type from its code. The eligibility
 *  rule (married female / married male) is enforced regardless of whether
 *  the effective policy carries the applicability fields yet. */
export const isMaternityCode = (code?: string): boolean => {
  const upper = (code ?? "").toUpperCase();
  return upper === "ML" || upper.includes("MATERNITY");
};

export const isPaternityCode = (code?: string): boolean => {
  const upper = (code ?? "").toUpperCase();
  // PL alone is "Privilege Leave" in most setups, so we match only the
  // explicit PAT short code and any code containing "PATERNITY".
  return upper === "PAT" || upper.includes("PATERNITY");
};

export interface GenderMaritalEligibility {
  ok: boolean;
  reason?: string;
}

export const checkGenderMaritalEligibility = (
  leaveTypeCode: string | null | undefined,
  gender: string | null | undefined,
  maritalStatus: string | null | undefined,
): GenderMaritalEligibility => {
  if (!leaveTypeCode) return { ok: true };
  const g = (gender ?? "").toUpperCase();
  const m = (maritalStatus ?? "").toUpperCase();
  if (isMaternityCode(leaveTypeCode)) {
    if (g !== "FEMALE") {
      return { ok: false, reason: "Maternity Leave is only available to female employees." };
    }
    if (m !== "MARRIED") {
      return { ok: false, reason: "Maternity Leave is only available to married employees." };
    }
    return { ok: true };
  }
  if (isPaternityCode(leaveTypeCode)) {
    if (g !== "MALE") {
      return { ok: false, reason: "Paternity Leave is only available to male employees." };
    }
    if (m !== "MARRIED") {
      return { ok: false, reason: "Paternity Leave is only available to married employees." };
    }
    return { ok: true };
  }
  return { ok: true };
};

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
