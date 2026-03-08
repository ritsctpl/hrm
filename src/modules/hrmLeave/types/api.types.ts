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
  createdDateTime?: string;
  modifiedDateTime?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface LeaveTypeRequest {
  site: string;
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
  version: number;
  active: number;
  createdDateTime?: string;
  modifiedDateTime?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface LeavePolicyRequest {
  site: string;
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
  site: string;
  employeeId: string;
  year: number;
}

export interface RecalculateRequest {
  site: string;
  employeeId: string;
  leaveTypeCode: string;
  year: number;
}

// ── Accrual ───────────────────────────────────────────────────────────

export interface AccrualRunRequest {
  site: string;
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
  site: string;
  batchId: string;
  requestedBy: string;
}

export interface YearQueryRequest {
  site: string;
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
  site: string;
  employeeId: string;
  year: number;
  leaveTypeCode?: string;
}

// ── Manual Adjustment ─────────────────────────────────────────────────

export interface ManualAdjustmentRequest {
  site: string;
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
  site: string;
  adjustments: ManualAdjustmentRequest[];
}

// ── Comp-Off ──────────────────────────────────────────────────────────

export interface CompOffCreditRequest {
  site: string;
  employeeId: string;
  workedOnDate: string;
  quantity: number;
  supervisorId?: string;
  expiryDate?: string;
  notes?: string;
  createdBy: string;
}

// ── Year-End ──────────────────────────────────────────────────────────

export interface YearEndRequest {
  site: string;
  year: number;
  triggeredBy: string;
}

// ── Payroll Export ────────────────────────────────────────────────────

export interface PayrollExportRequest {
  site: string;
  year: number;
  month: number;
  format: "CSV" | "XLSX";
  requestedBy: string;
}

export interface LockMonthRequest {
  site: string;
  year: number;
  month: number;
  lockedBy: string;
}

// ── Reports ───────────────────────────────────────────────────────────

export interface ReportQueryRequest {
  site: string;
  year: number;
  buId?: string;
  deptId?: string;
}

export interface LeaveAvailedReportRequest {
  site: string;
  fromDate: string;
  toDate: string;
  leaveTypeCode?: string;
}

// ── Leave Request ─────────────────────────────────────────────────────

export interface LeaveRequestCreateDto {
  site: string;
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
  state: "eligible" | "insufficient_balance" | "overlap_detected" | "requires_hr_review";
  conflictFlags: string[];
  messages: string[];
  overlaps: OverlapDetail[];
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
  site: string;
  requestId: string;
  actorId: string;
  actorRole: string;
  remarks?: string;
  reassignToId?: string;
}

export interface CancelLeaveRequest {
  site: string;
  requestId: string;
  reason: string;
  cancelledBy: string;
}

export interface EmployeeQueryRequest {
  site: string;
  employeeId: string;
}

export interface GetByIdRequest {
  site: string;
  id: string;
}

export interface ApproverInboxRequest {
  site: string;
  approverId: string;
}

export interface GlobalQueueRequest {
  site: string;
  buId?: string;
  deptId?: string;
  status?: string;
  leaveTypeCode?: string;
  slaBreachOnly?: boolean;
  fromDate?: string;
  toDate?: string;
}

export interface SiteRequest {
  site: string;
}

export interface LeavePolicyQueryRequest {
  site: string;
  leaveTypeId: string;
}

// ── Leave Type Retrieve / Delete / Toggle ────────────────────────────

export interface LeaveTypeByCodeRequest {
  site: string;
  code: string;
}

export interface DeleteLeaveTypeRequest {
  site: string;
  leaveTypeId: string;
  deletedBy: string;
}

export interface ActivateDeactivateLeaveTypeRequest {
  site: string;
  handle: string;
  activeStatus: boolean;
  modifiedBy?: string;
}

// ── Policy Delete ────────────────────────────────────────────────────

export interface DeletePolicyRequest {
  site: string;
  policyId: string;
  deletedBy: string;
}

// ── Effective Policy ─────────────────────────────────────────────────

export interface EffectivePolicyRequest {
  site: string;
  leaveTypeId: string;
  buId?: string;
  deptId?: string;
}

// ── Balance By Type ──────────────────────────────────────────────────

export interface BalanceByTypeRequest {
  site: string;
  employeeId: string;
  leaveTypeCode: string;
  year: number;
}

// ── Team Calendar ────────────────────────────────────────────────────

export interface TeamCalendarRequest {
  site: string;
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
  site: string;
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
  site: string;
  levels: ApprovalLevel[];
  autoEscalateDays: number;
  notifyHrOnEscalation: boolean;
  modifiedBy?: string;
}

export interface ApprovalLevel {
  level: number;
  role: "SUPERVISOR" | "NEXT_SUPERIOR" | "HR";
  required: boolean;
}

export interface SaveApprovalConfigRequest {
  site: string;
  levels: ApprovalLevel[];
  autoEscalateDays: number;
  notifyHrOnEscalation: boolean;
  modifiedBy: string;
}

// ── Export Leave Report ──────────────────────────────────────────────

export interface ExportLeaveReportRequest {
  site: string;
  reportType: string;
  fromDate?: string;
  toDate?: string;
  leaveTypeCode?: string;
  buId?: string;
  deptId?: string;
  year?: number;
  format?: "CSV" | "XLSX";
}
