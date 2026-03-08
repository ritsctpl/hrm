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
  createdDateTime?: string;
  modifiedDateTime?: string;
  createdBy?: string;
  modifiedBy?: string;
}

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
  active?: number;
  createdDateTime?: string;
  modifiedDateTime?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface ValidationSummary {
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
