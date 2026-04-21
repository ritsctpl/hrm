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
  createdBy?: string;
}

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
  effectiveFrom: string;
  effectiveTo?: string;
  accrualFrequency?: string;
  accrualQuantity: number;
  prorateEnabled: boolean;
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
  availableAfterMonths?: number;
  entitlementTiers?: LeaveEntitlementTier[];
  version: number;
  active: number;
  createdDateTime?: string;
  modifiedDateTime?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface LeavePolicyRequest {
  organizationId: string;
  leaveTypeId: string;
  leaveTypeCode: string;
  buId?: string;
  deptId?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  accrualFrequency: string;
  accrualQuantity: number;
  prorateEnabled?: boolean;
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
  entitlementTiers?: LeaveEntitlementTier[];
  createdBy: string;
}

// ── Balance ───────────────────────────────────────────────────────────

export interface LeaveBalanceResponse {
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
  encashmentAllowed: boolean;
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
}

export interface LedgerHistoryRequest {
  organizationId: string;
  employeeId: string;
  year: number;
  leaveTypeCode?: string;
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
}

// ── Leave Request ─────────────────────────────────────────────────────

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
  attachmentPath?: string;
  createdBy: string;
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
    | "blackout_period";
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
  attachmentPath?: string;
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
  employeeId: string;
  employeeName: string;
  date: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  dayType: "FULL" | "FIRST_HALF" | "SECOND_HALF";
  status: LeaveRequestStatus;
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
