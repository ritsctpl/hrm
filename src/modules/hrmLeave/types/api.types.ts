// ── Leave Type ──────────────────────────────────────────────────────

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
  applicableGender?: 'ALL' | 'MALE' | 'FEMALE';
  createdDateTime?: string;
  modifiedDateTime?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface LeaveTypeRequest {
  organizationId: string;
  handle?: string;
  code: string;
  name: string;
  alias?: string;
  halfDayAllowed?: boolean;
  activeStatus?: boolean;
  category?: string;
  sortOrder?: number;
  /** When true, the leave type is included in accrual runs and shown in
   *  the Accruals Preview. */
  accrualEnabled?: boolean;
  /** @deprecated Gender applicability moved to the Leave Policy. Retained
   *  so existing records still round-trip. */
  applicableGender?: 'ALL' | 'MALE' | 'FEMALE';
  createdBy?: string;
}

// ── Employment Status ────────────────────────────────────────────────

/** Employment status a leave policy can be scoped to. Distinct from
 *  `employeeType` (PERMANENT / CONTRACT / INTERN …), which describes the
 *  contract rather than where the employee sits in the joiner lifecycle. */
export type EmployeeStatus =
  | "PROBATION"
  | "PERMANENT"
  | "NOTICE_PERIOD"
  | "TERMINATED";

// ── Leave Entitlement Tier ───────────────────────────────────────────

export interface LeaveEntitlementTier {
  minTenureYears: number;
  maxTenureYears: number;
  annualEntitlement: number;
}

// ── Leave Policy ─────────────────────────────────────────────────────

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
  /** Policy applicability — round-tripped from LeavePolicyRequest. */
  applicableGender?: string;
  /** Policy applicability — round-tripped from LeavePolicyRequest. */
  applicableMaritalStatus?: string;
  employeeType?: string;
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
  /** @deprecated Superseded by `eligibilityMonths`, which expresses the same
   *  waiting period against an explicit anchor. Still returned by the
   *  backend; the policy form migrates any legacy value on edit and then
   *  writes 0 here. */
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
  active: number;
  createdDateTime?: string;
  modifiedDateTime?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface LeavePolicyRequest {
  organizationId: string;
  handle?: string;  // Pass when updating existing policy
  leaveTypeId: string;
  leaveTypeCode: string;
  buId?: string;
  deptId?: string;
  /** Human-readable department name, sent alongside `deptId` so the backend
   *  can persist and round-trip the label for display. */
  deptName?: string;
  /** Policy applicability — gender ('ALL' | 'MALE' | 'FEMALE' | 'OTHER'). */
  applicableGender?: string;
  /** Policy applicability — marital status ('ALL' | 'SINGLE' | 'MARRIED' |
   *  'DIVORCED' | 'WIDOWED'). Drives Maternity / Paternity eligibility.
   *  Named to mirror `applicableGender` so the backend sees both fields
   *  under the same naming convention. */
  applicableMaritalStatus?: string;
  /** Policy applicability — employment type (PERMANENT, CONTRACT, …). */
  employeeType?: string;
  /** Policy applicability — designation. */
  designation?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  accrualFrequency: string;
  accrualQuantity: number;
  prorateEnabled?: boolean;
  accrualStartBasis?: string;
  carryForwardAllowed?: boolean;
  carryForwardCap?: number;
  lapseRule?: string;
  lapseDate?: string;
  encashmentAllowed?: boolean;
  encashWhen?: string;
  encashRateFormula?: string;
  minEncashableDays?: number;
  maxEncashableDays?: number;
  encashRounding?: string;
  negativeBalanceAllowed?: boolean;
  negativeFloor?: number;
  coExpiryDays?: number;
  supervisorSlaDays?: number;
  escalationSlaDays?: number;
  /** @deprecated Superseded by `eligibilityMonths`. The form always sends 0
   *  so a legacy value stops being enforced once the policy is re-saved. */
  availableAfterMonths?: number;
  entitlementTiers?: LeaveEntitlementTier[];
  // ── Earned-Leave configuration ──────────────────────────────────────
  // All optional with backend defaults, so policies saved before the EL
  // rollout round-trip unchanged.
  applicableEmployeeStatus?: EmployeeStatus[];
  eligibilityMonths?: number;
  creditCycleMonths?: number;
  maxAccumulation?: number;
  countWeekOffBefore?: boolean;
  countWeekOffBetween?: boolean;
  countWeekOffAfter?: boolean;
  countHolidayBefore?: boolean;
  countHolidayBetween?: boolean;
  countHolidayAfter?: boolean;
  encashmentAllowedDuringEmployment?: boolean;
  encashmentAllowedDuringExit?: boolean;
  encashmentBasicDivisor?: number;
  createdBy: string;
}

// ── Balance ───────────────────────────────────────────────────────────

export interface LeaveBalanceResponse {
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
  /** Magnitude of the permitted negative balance (e.g. 2 means the
   *  balance may reach -2). Authoritative; see `negativeBalanceAllowed`. */
  negativeFloor?: number;
  halfDayAllowed: boolean;
  lastCalculatedAt: string;
}

export interface BalanceQueryRequest {
  organizationId: string;
  employeeId: string;
  year: number;
}

export interface RecalculateRequest {
  organizationId: string;
  employeeId: string;
  leaveTypeCode: string;
  year: number;
}

// ── Accrual ───────────────────────────────────────────────────────────

export interface AccrualRunRequest {
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  quarter: string;
  year: number;
  preview: boolean;
  excludedEmployeeIds?: string[];
  createdBy: string;
}

export interface AccrualPreviewResponse {
  batchId: string;
  periodStart: string;
  periodEnd: string;
  quarter: string;
  year: number;
  totalEligibleEmployees: number;
  totalDaysToCredit: number;
  lines: AccrualPreviewLineDto[];
  errors: string[];
  canPost: boolean;
}

export interface AccrualPreviewLineDto {
  employeeId: string;
  employeeName: string;
  leaveTypeCode: string;
  daysToCredit: number;
  prorated: boolean;
  prorateReason?: string;
  excluded: boolean;
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
  excludedEmployeeIds?: string[];
  reversedBatchId?: string;
  active: number;
  createdDateTime: string;
  createdBy: string;
}

export interface RollbackRequest {
  organizationId: string;
  batchId: string;
  requestedBy: string;
}

export interface YearQueryRequest {
  organizationId: string;
  year: number;
}

// ── Ledger ────────────────────────────────────────────────────────────

export interface LedgerHistoryResponse {
  handle: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  transactionDate: string;
  quantity: number;
  direction: "CR" | "DR";
  refType: "ACCRUAL" | "LEAVE" | "ADJUST" | "CARRY" | "LAPSE" | "ENCASH" | "CO" | "WFH";
  reasonCode?: string;
  notes?: string;
  balanceBefore: number;
  balanceAfter: number;
  locked: boolean;
  createdDateTime: string;
  createdBy: string;
  // Present when fetched via `/ledger/report` for a multi-employee scope
  // (e.g. department filter). Absent on the single-employee `/ledger/history`
  // response.
  employeeId?: string;
  employeeName?: string;
}

export interface LedgerHistoryRequest {
  organizationId: string;
  employeeId: string;
  year: number;
  leaveTypeCode?: string;
}

// `/ledger/report` accepts the same shape but with optional employeeId so HR
// can fetch ledger entries scoped by department / leave type. Department
// filter is honoured here; the older `/ledger/history` controller silently
// drops it.
export interface LedgerReportRequest {
  organizationId: string;
  employeeId?: string;
  year: number;
  leaveTypeCode?: string;
  deptId?: string;
}

// ── Manual Adjustment ─────────────────────────────────────────────────

export interface ManualAdjustmentRequest {
  organizationId: string;
  employeeId: string;
  leaveTypeCode: string;
  quantity: number;
  direction: "CR" | "DR";
  transactionDate: string;
  reasonCode: string;
  notes?: string;
  attachmentPath?: string;
  createdBy: string;
}

export interface BulkAdjustmentRequest {
  organizationId: string;
  adjustments: ManualAdjustmentRequest[];
}

// ── Comp-Off ──────────────────────────────────────────────────────────

export interface CompOffCreditRequest {
  organizationId: string;
  employeeId: string;
  workedOnDate: string;
  quantity: number;
  supervisorId?: string;
  expiryDate?: string;
  notes?: string;
  createdBy: string;
}

// ── Comp-Off Request Workflow ──────────────────────────────────────
export interface CompOffRequest {
  handle: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  workedDate: string;
  hours: number;
  quantity: number;
  reason: string;
  supervisorId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CREDITED';
  rejectionReason?: string;
  expiryDate?: string;
  createdDateTime: string;
  createdBy: string;
}

export interface CompOffSubmitRequest {
  organizationId: string;
  employeeId: string;
  workedDate: string;
  hours: number;
  quantity: number;
  reason: string;
  supervisorId?: string;
  createdBy: string;
}

export interface CompOffActionRequest {
  organizationId: string;
  requestId: string;
  actorId: string;
  remarks?: string;
}

export interface CompOffMyRequestsRequest {
  organizationId: string;
  employeeId: string;
}

export interface CompOffPendingRequest {
  organizationId: string;
  approverId: string;
}

// ── Year-End ──────────────────────────────────────────────────────────

export interface YearEndRequest {
  organizationId: string;
  year: number;
  triggeredBy: string;
}

// ── Payroll Export ────────────────────────────────────────────────────

export interface PayrollExportRequest {
  organizationId: string;
  year: number;
  month: number;
  format: "CSV" | "XLSX";
  requestedBy: string;
}

export interface LockMonthRequest {
  organizationId: string;
  year: number;
  month: number;
  lockedBy: string;
}

// ── Reports ───────────────────────────────────────────────────────────

export interface ReportQueryRequest {
  organizationId: string;
  year: number;
  buId?: string;
  deptId?: string;
}

export interface LeaveAvailedReportRequest {
  organizationId: string;
  fromDate: string;
  toDate: string;
  leaveTypeCode?: string;
  /** Backend now resolves via resolveCandidates — accepts handle / code /
   *  composite. Sent when the user picks an Employee in the report
   *  filter; absent for org-wide reports. */
  employeeId?: string;
  /** Optional department-name filter; backend matches via employee-master
   *  enrichment, same as global-queue. */
  deptId?: string;
}

// ── Leave Request ─────────────────────────────────────────────────────

/** What the frontend uploads with a new leave request. Each file is sent
 *  with its name + content type so the backend can persist a meaningful
 *  display label and serve the right Content-Type on download. */
export interface LeaveRequestAttachmentUpload {
  name: string;
  contentType: string;
  /** Base64 string. Includes the data-URI prefix when produced by
   *  FileReader.readAsDataURL — backend should strip if present. */
  contentBase64: string;
}

/** What the backend returns for an existing attachment on a leave row.
 *  Either downloadUrl OR contentBase64 must be populated; the FE
 *  prefers downloadUrl when both are present. */
export interface LeaveRequestAttachment {
  id: string;
  name: string;
  contentType?: string;
  sizeBytes?: number;
  /** Pre-signed or app-relative URL the FE can use directly. */
  downloadUrl?: string;
  /** Inline base64 fallback when no URL is exposed. */
  contentBase64?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface LeaveRequestCreateDto {
  organizationId: string;
  employeeId: string;
  leaveTypeCode: string;
  startDate: string;
  endDate: string;
  startDayType: "FULL" | "FIRST_HALF" | "SECOND_HALF";
  endDayType: "FULL" | "FIRST_HALF" | "SECOND_HALF";
  totalDays: number;
  reason: string;
  /** Legacy single-file path — kept for backward compatibility while
   *  multi-attachment rolls out. New code should use `attachments`. */
  attachmentPath?: string;
  attachments?: LeaveRequestAttachmentUpload[];
  createdBy: string;
  /**
   * Optional reference to an existing DRAFT request. When present:
   *   - on /save-draft: BE updates the draft in-place (returns INVALID_DRAFT_STATE
   *     if the referenced request is no longer in DRAFT status).
   *   - on /submit: BE reuses the same handle to transition DRAFT → PENDING_SUPERVISOR
   *     instead of creating a duplicate request.
   */
  handle?: string;
}

export interface ValidationSummaryResponse {
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

export interface LeaveRequestAction {
  actionId: string;
  actorId: string;
  actorName: string;
  actorRole: "EMPLOYEE" | "SUPERVISOR" | "NEXT_SUPERIOR" | "HR" | "SYSTEM";
  action: "SUBMIT" | "APPROVE" | "REJECT" | "ESCALATE" | "CANCEL" | "REASSIGN" | "OVERRIDE";
  fromStatus: string;
  toStatus: string;
  remarks?: string;
  escalationLevel: number;
  actionDateTime: string;
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
  startDayType: "FULL" | "FIRST_HALF" | "SECOND_HALF";
  endDayType: "FULL" | "FIRST_HALF" | "SECOND_HALF";
  totalDays: number;
  reason: string;
  /** Legacy single-file path — present on rows that pre-date the
   *  multi-attachment rollout. Approver UI shows this as one item. */
  attachmentPath?: string;
  /** New canonical multi-attachment list. */
  attachments?: LeaveRequestAttachment[];
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

export type LeaveRequestStatus =
  | "DRAFT"
  | "PENDING_SUPERVISOR"
  | "PENDING_NEXT_SUPERIOR"
  | "PENDING_HR"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "ESCALATED";

export type LeaveRequestResponse = LeaveRequest;

export interface ApprovalActionRequest {
  organizationId: string;
  requestId: string;
  actorId: string;
  actorRole: string;
  remarks?: string;
  reassignToId?: string;
}

export interface CancelLeaveRequest {
  organizationId: string;
  requestId: string;
  reason: string;
  cancelledBy: string;
}

export interface EmployeeQueryRequest {
  organizationId: string;
  employeeId: string;
}

export interface GetByIdRequest {
  organizationId: string;
  id: string;
}

export interface ApproverInboxRequest {
  organizationId: string;
  approverId: string;
}

export interface GlobalQueueRequest {
  organizationId: string;
  buId?: string;
  deptId?: string;
  status?: string;
  leaveTypeCode?: string;
  slaBreachOnly?: boolean;
  fromDate?: string;
  toDate?: string;
}

export interface SiteRequest {
  organizationId: string;
}

export interface LeavePolicyQueryRequest {
  organizationId: string;
  leaveTypeId: string;
}

// ── Leave Type Retrieve / Delete / Toggle ────────────────────────────

export interface LeaveTypeByCodeRequest {
  organizationId: string;
  code: string;
}

export interface DeleteLeaveTypeRequest {
  organizationId: string;
  leaveTypeId: string;
  deletedBy: string;
}

export interface ActivateDeactivateLeaveTypeRequest {
  organizationId: string;
  handle: string;
  activeStatus: boolean;
  modifiedBy?: string;
}

// ── Policy Delete ────────────────────────────────────────────────────

export interface DeletePolicyRequest {
  organizationId: string;
  policyId: string;
  deletedBy: string;
}

// ── Effective Policy ─────────────────────────────────────────────────

export interface EffectivePolicyRequest {
  organizationId: string;
  leaveTypeId: string;
  buId?: string;
  deptId?: string;
  /** Applying employee — so the backend picks the policy matching their gender/marital status. */
  employeeId?: string;
}

// ── Balance By Type ──────────────────────────────────────────────────

export interface BalanceByTypeRequest {
  organizationId: string;
  employeeId: string;
  leaveTypeCode: string;
  year: number;
}

// ── Team Calendar ────────────────────────────────────────────────────

export interface TeamCalendarRequest {
  organizationId: string;
  managerId: string;
  month: number;
  year: number;
}

export interface TeamCalendarEntry {
  date: string;
  // Leave rows carry these; holiday rows (holiday === true) return null for
  // every employee/leave field and only populate holidayName.
  employeeId: string | null;
  employeeName: string | null;
  leaveTypeCode: string | null;
  leaveTypeName: string | null;
  dayType?: "FULL" | "FIRST_HALF" | "SECOND_HALF" | null;
  status: LeaveRequestStatus | null;
  requestHandle?: string | null;
  holidayName?: string | null;
  holiday?: boolean;
}

// ── Amend Leave Request ──────────────────────────────────────────────

export interface AmendLeaveRequestPayload {
  organizationId: string;
  handle: string;
  startDate?: string;
  endDate?: string;
  startDayType?: "FULL" | "FIRST_HALF" | "SECOND_HALF";
  endDayType?: "FULL" | "FIRST_HALF" | "SECOND_HALF";
  totalDays?: number;
  reason?: string;
  amendedBy: string;
  /** Replacement attachments. Only sent when the user adds files during the
   *  amend — an empty/omitted list leaves existing attachments untouched. */
  attachments?: LeaveRequestAttachmentUpload[];
}

// ── Approval Config ──────────────────────────────────────────────────

export interface LeaveApprovalConfig {
  organizationId: string;
  levels: ApprovalLevel[];
  autoEscalateDays: number;
  notifyHrOnEscalation: boolean;
  cancellationWindowHours?: number;
  modifiedBy?: string;
}

export interface ApprovalLevel {
  level: number;
  role: "SUPERVISOR" | "NEXT_SUPERIOR" | "HR";
  required: boolean;
}

export interface SaveApprovalConfigRequest {
  organizationId: string;
  levels: ApprovalLevel[];
  autoEscalateDays: number;
  notifyHrOnEscalation: boolean;
  modifiedBy: string;
}

// ── Export Leave Report ──────────────────────────────────────────────

export interface ExportLeaveReportRequest {
  organizationId: string;
  reportType: string;
  fromDate?: string;
  toDate?: string;
  leaveTypeCode?: string;
  buId?: string;
  deptId?: string;
  year?: number;
  format?: "CSV" | "XLSX";
}

// ── Calculate Working Days ──────────────────────────────────────────
export interface CalculateDaysRequest {
  organizationId: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  startDayType: "FULL" | "FIRST_HALF" | "SECOND_HALF";
  endDayType: "FULL" | "FIRST_HALF" | "SECOND_HALF";
  /** Always send this. Without it the backend ignores the policy's
   *  week-off / holiday counting rules, so the preview disagrees with what
   *  /leave-request/submit actually deducts. */
  leaveTypeCode?: string;
}

export interface ExcludedHoliday {
  date: string;
  name: string;
}

export interface CalculateDaysResponse {
  calculatedDays: number;
  calendarDays: number;
  excludedHolidays: ExcludedHoliday[];
  excludedWeekends: string[];
  /** ISO dates of the week-offs / holidays the policy *charges* (sandwich
   *  rules). These are included in `calculatedDays` — they are not excluded
   *  days. Absent on backends predating the EL rollout. */
  countedNonWorkingDays?: string[];
}

// ── Bulk Approval ───────────────────────────────────────────────────
export interface BulkApprovalRequest {
  organizationId: string;
  requestIds: string[];
  actorId: string;
  actorRole: string;
  remarks?: string;
}

export interface BulkApprovalResponse {
  approved: string[];
  failed: { requestId: string; reason: string }[];
}

// ── Balance Initialize ──────────────────────────────────────────────
export interface InitializeBalanceRequest {
  organizationId: string;
  employeeId: string;
  joiningDate: string;
}

// ── Approval Delegation ────────────────────────────────────────────
export interface SetDelegationRequest {
  organizationId: string;
  approverId: string;
  delegateIds: string[];
  fromDate: string;
  toDate: string;
}

export interface DelegationEntry {
  handle: string;
  approverId: string;
  approverName: string;
  delegateId: string;
  delegateName: string;
  fromDate: string;
  toDate: string;
  active: number;
}

export interface DeleteDelegationRequest {
  organizationId: string;
  handle: string;
}

// ── Leave Settlement on Separation ──────────────────────────────────
export interface SettleSeparationRequest {
  organizationId: string;
  employeeId: string;
  lastWorkingDate: string;
  triggeredBy: string;
}

export interface LeaveSettlementItem {
  leaveTypeCode: string;
  leaveTypeName: string;
  currentBalance: number;
  encashedDays: number;
  lapsedDays: number;
  cancelledRequests: number;
}

export interface SettleSeparationResponse {
  employeeId: string;
  settlements: LeaveSettlementItem[];
  totalEncashed: number;
  totalLapsed: number;
  totalCancelledRequests: number;
}

// ── Leave Register Report ───────────────────────────────────────────
export interface LeaveRegisterRequest {
  organizationId: string;
  year: number;
  format: 'FORM_14' | 'FORM_8' | 'CUSTOM';
}

export interface LeaveRegisterRow {
  employeeNumber: string;
  employeeName: string;
  department: string;
  designation: string;
  joiningDate: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  openingBalance: number;
  monthlyAvailed: number[];  // 12 elements, Jan-Dec
  totalAvailed: number;
  closingBalance: number;
  carryForward: number;
  encashed: number;
  lapsed: number;
}

// ── Leave Analytics ─────────────────────────────────────────────────
export interface AnalyticsRequest {
  organizationId: string;
  year: number;
  month?: number;
  deptId?: string;
  limit?: number;
}

export interface AbsenteeismData {
  department: string;
  totalEmployees: number;
  totalLeaveDays: number;
  absenteeismRate: number; // percentage
}

export interface LeaveTrendData {
  month: number;
  monthName: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  totalDays: number;
}

export interface TopAbsenteeData {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  totalLeaveDays: number;
  wfhDays?: number;
  leaveBreakdown: { leaveTypeCode: string; days: number }[];
}

// ── Blackout Periods ────────────────────────────────────────────────
export interface LeaveBlackoutPeriod {
  handle: string;
  organizationId: string;
  name: string;
  startDate: string;
  endDate: string;
  applicableLeaveTypes: string[]; // empty = all types
  applicableDepartments: string[]; // empty = all depts
  reason: string;
  active: number;
  createdDateTime: string;
  createdBy: string;
}

export interface BlackoutPeriodRequest {
  organizationId: string;
  name: string;
  startDate: string;
  endDate: string;
  applicableLeaveTypes?: string[];
  applicableDepartments?: string[];
  reason: string;
  createdBy: string;
}

export interface DeleteBlackoutRequest {
  organizationId: string;
  handle: string;
}

// ── Delete Leave Request ─────────────────────────────────────────────

export interface DeleteLeaveRequestPayload {
  organizationId: string;
  requestId: string;
  employeeId: string;
  reason?: string;
}

// ── Team History ──────────────────────────────────────────────────────

export interface TeamHistoryRequest {
  organizationId: string;
  managerId: string;
  employeeFilter?: string;
  leaveTypeCode?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  deptId?: string;
  buId?: string;
  designation?: string;
  page?: number;
  size?: number;
}

export interface TeamHistoryResponse {
  items: LeaveRequest[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
