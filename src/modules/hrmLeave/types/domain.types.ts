export type LeaveRequestStatus =
  | "DRAFT"
  | "PENDING_SUPERVISOR"
  | "PENDING_NEXT_SUPERIOR"
  | "PENDING_HR"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "ESCALATED";

export type DayType = "FULL" | "FIRST_HALF" | "SECOND_HALF";

/** Employment status a leave policy can be scoped to. Distinct from
 *  `employeeType` (PERMANENT / CONTRACT / INTERN …), which describes the
 *  contract rather than where the employee sits in the joiner lifecycle. */
export type EmployeeStatus =
  | "PROBATION"
  | "PERMANENT"
  | "NOTICE_PERIOD"
  | "TERMINATED";

export interface LeaveAttachment {
  id: string;
  name: string;
  contentType?: string;
  sizeBytes?: number;
  downloadUrl?: string;
  contentBase64?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export type LedgerRefType =
  | "ACCRUAL"
  | "LEAVE"
  | "ADJUST"
  | "CARRY"
  | "LAPSE"
  | "ENCASH"
  | "CO"
  | "WFH";

export interface LeaveBalance {
  employeeId?: string;
  employeeNumber?: string;
  employeeName?: string;
  department?: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  leaveTypeAlias?: string;
  year: number;
  openingCarryForward: number;
  ytdCredits: number;
  ytdDebits: number;
  ytdEncashed: number;
  ytdLapsed: number;
  pendingApproval: number;
  currentBalance: number;
  availableBalance: number;
  carryForwardAllowed: boolean;
  carryForwardCap: number;
  /** Balance ceiling from the effective policy; excess above this lapses.
   *  0 / absent = no ceiling. */
  maxAccumulation?: number;
  encashmentAllowed: boolean;
  /** Whether the effective policy permits going below zero. Authoritative
   *  for validation — supersedes the same field on the policy when both
   *  are present. */
  negativeBalanceAllowed?: boolean;
  /** Magnitude of the permitted negative balance (e.g. 2 ⇒ may reach -2). */
  negativeFloor?: number;
  halfDayAllowed: boolean;
  lastCalculatedAt: string;
}

export interface LeaveRequest {
  handle: string;
  site: string;
  employeeId: string;
  employeeName: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  startDayType: DayType;
  endDayType: DayType;
  totalDays: number;
  reason: string;
  attachmentPath?: string;
  attachments?: LeaveAttachment[];
  balanceBefore: number;
  balanceAfter: number;
  status: LeaveRequestStatus;
  currentApproverId?: string;
  escalationLevel: number;
  slaDeadline?: string;
  slaBreached: boolean;
  supervisorId?: string;
  nextSuperiorId?: string;
  hrId?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  ledgerEntryId?: string;
  actionHistory: LeaveRequestAction[];
  active: number;
  createdDateTime: string;
  createdBy: string;
}

export interface LeaveRequestAction {
  actionId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  remarks?: string;
  escalationLevel: number;
  actionDateTime: string;
}

export interface LedgerEntry {
  handle: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  transactionDate: string;
  quantity: number;
  direction: "CR" | "DR";
  refType: LedgerRefType;
  reasonCode?: string;
  notes?: string;
  balanceBefore: number;
  balanceAfter: number;
  locked: boolean;
  createdDateTime: string;
  createdBy: string;
}

export interface AccrualBatch {
  handle: string;
  site: string;
  periodStart: string;
  periodEnd: string;
  postDate: string;
  quarter: string;
  year: number;
  status: "PREVIEW" | "POSTED" | "ROLLED_BACK";
  totalEmployees: number;
  totalDaysCredited: number;
  createdDateTime: string;
  createdBy: string;
}

export interface LeaveType {
  handle: string;
  site: string;
  code: string;
  name: string;
  alias?: string;
  unit: string;
  halfDayAllowed: boolean;
  active: number;
  category: string;
  sortOrder: number;
  /**
   * When true, this leave type participates in accrual runs and is shown
   * in the Accruals Preview. Gender applicability has moved to the Leave
   * Policy (see LeavePolicy.applicableGender); `applicableGender` here is
   * retained only for backward-compat with existing records.
   */
  accrualEnabled?: boolean;
  /** @deprecated Gender applicability moved to LeavePolicy. */
  applicableGender?: 'ALL' | 'MALE' | 'FEMALE';
  createdDateTime?: string;
  modifiedDateTime?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface LeaveEntitlementTier {
  minTenureYears: number;
  maxTenureYears: number;
  annualEntitlement: number;
}

export interface LeavePolicy {
  handle: string;
  site: string;
  leaveTypeId?: string;
  leaveTypeCode?: string;
  buId?: string;
  deptId?: string;
  /** Human-readable department name, persisted alongside `deptId` so the
   *  policy can be displayed without a separate directory lookup. */
  deptName?: string;
  /** Policy applicability — restricts this policy to a gender. 'ALL' (or
   *  unset) applies to everyone. */
  applicableGender?: string;
  /** Policy applicability — restricts to a marital status (SINGLE, MARRIED,
   *  DIVORCED, WIDOWED). Drives Maternity / Paternity eligibility together
   *  with `applicableGender`. Named to mirror `applicableGender`. */
  applicableMaritalStatus?: string;
  /** Policy applicability — restricts to an employment type (PERMANENT,
   *  CONTRACT, INTERN, …). Unset applies to all employee types. */
  employeeType?: string;
  /** Policy applicability — restricts to a designation. Unset applies to
   *  all designations. */
  designation?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  accrualFrequency?: string;
  accrualQuantity: number;
  prorateEnabled: boolean;
  /** Proration anchor: "JOINING" (default) or "CONFIRMATION" (probation end). */
  accrualStartBasis?: string;
  carryForwardAllowed: boolean;
  carryForwardCap: number;
  lapseRule?: string;
  lapseDate?: string;
  encashmentAllowed: boolean;
  encashWhen?: string;
  encashRateFormula?: string;
  minEncashableDays?: number;
  maxEncashableDays?: number;
  encashRounding?: string;
  negativeBalanceAllowed: boolean;
  negativeFloor?: number;
  coExpiryDays?: number;
  supervisorSlaDays: number;
  escalationSlaDays: number;
  probationRestricted?: boolean;
  /** @deprecated Superseded by `eligibilityMonths`. Retained so existing
   *  records still round-trip; the policy form migrates it on edit. */
  availableAfterMonths?: number;
  entitlementTiers?: LeaveEntitlementTier[];
  // ── Earned-Leave configuration ──────────────────────────────────────
  /** Employment statuses this policy applies to. Empty/absent = all. */
  applicableEmployeeStatus?: EmployeeStatus[];
  /** Months of service from the `accrualStartBasis` anchor before the leave
   *  is earned or may be taken. 0 = no waiting period. */
  eligibilityMonths?: number;
  /** Cycle length in months when `accrualFrequency` is "ANNIVERSARY". */
  creditCycleMonths?: number;
  /** Balance ceiling after carry-forward; the excess lapses. 0 = no ceiling. */
  maxAccumulation?: number;
  /** Sandwich rules — charge non-working days before / between / after the
   *  leave span. "Between" is the classic sandwich rule. */
  countWeekOffBefore?: boolean;
  countWeekOffBetween?: boolean;
  countWeekOffAfter?: boolean;
  countHolidayBefore?: boolean;
  countHolidayBetween?: boolean;
  countHolidayAfter?: boolean;
  encashmentAllowedDuringEmployment?: boolean;
  encashmentAllowedDuringExit?: boolean;
  /** Divisor in the encashment formula: (Basic / divisor) × days. */
  encashmentBasicDivisor?: number;
  version: number;
  active?: number;
  createdDateTime?: string;
  modifiedDateTime?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface ExcludedHoliday {
  date: string;
  name: string;
}

export interface ValidationSummary {
  leaveTypeCode: string;
  requestedUnits: number;
  balanceBefore: number;
  balanceAfter: number;
  state:
    | "eligible"
    | "insufficient_balance"
    | "overlap_detected"
    | "requires_hr_review"
    | "insufficient_notice"
    | "below_minimum"
    | "exceeds_maximum"
    | "probation_restricted"
    | "gender_restricted"
    | "backdated_requires_hr"
    | "clubbing_violation"
    | "blackout_period"
    /** Employee has not completed the policy's `eligibilityMonths` from the
     *  accrual anchor (joining / confirmation). */
    | "not_yet_eligible"
    /** Employee's employment status is not in `applicableEmployeeStatus`. */
    | "status_not_eligible";
  conflictFlags: string[];
  messages: string[];
  overlaps: OverlapDetail[];
  calculatedDays?: number;
  sandwichDaysAdded?: number;
  excludedHolidays?: ExcludedHoliday[];
}

export interface OverlapDetail {
  requestId: string;
  startDate: string;
  endDate: string;
  status: string;
}
