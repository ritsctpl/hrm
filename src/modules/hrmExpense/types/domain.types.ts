export type ExpenseStatus =
  | "DRAFT"
  | "PENDING_SUPERVISOR"
  | "ESCALATED"
  | "PENDING_FINANCE"
  | "APPROVED"
  | "REJECTED"
  | "PAID"
  | "RECALLED"
  | "CANCELLED";

export type ExpenseType = "ADVANCE" | "REIMBURSEMENT" | "MILEAGE" | "TRAVEL" | "GENERAL";

export type PaymentMode = "NEFT" | "IMPS" | "CHEQUE" | "CASH";

export interface ExpenseReport {
  handle: string;
  requestId: string;
  site?: string;
  employeeId: string;
  employeeName: string;
  expenseType: ExpenseType;
  purpose: string;
  travelRequestId?: string;
  costCenter?: string;
  projectCode?: string;
  wbsCode?: string;
  currency: string;
  exchangeRate: number;
  totalClaimedAmount: number;
  totalClaimedAmountInr: number;
  sanctionedAmount?: number;
  perDiemAmount?: number;
  outOfPolicy: boolean;
  outOfPolicyJustification?: string;
  originalsReceived?: boolean;
  paymentMode?: PaymentMode;
  paymentReference?: string;
  paymentDate?: string;
  financeRemarks?: string;
  items: ExpenseItem[];
  attachments?: ExpenseAttachment[];
  approvalHistory: ExpenseApprovalAction[];
  status: ExpenseStatus;
  currentApproverId?: string;
  currentApproverName?: string;
  escalationLevel?: number;
  slaDeadline?: string;
  slaBreached?: boolean;
  submittedAt?: string;
  createdDateTime: string;
  createdBy?: string;
  active?: number;
}

export interface ExpenseItem {
  handle: string;
  categoryId: string;
  categoryName?: string;
  expenseDate: string;
  description: string;
  amount: number;
  currency: string;
  fromLocation?: string;
  toLocation?: string;
  distanceKm?: number;
  ratePerKm?: number;
  mileageAmount?: number;
  attachmentRef?: string;
  outOfPolicy: boolean;
}

export interface ExpenseAttachment {
  attachmentId: string;
  fileName: string;
  fileSizeBytes: number;
  linkedLineItemId?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ExpenseApprovalAction {
  actorName?: string;
  actorRole: string;
  action: string;
  remarks?: string;
  sanctionedAmount?: number;
  paymentReference?: string;
  actionAt: string;
}

export interface ExpenseCategory {
  handle: string;
  site: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  dailyLimit?: number;
  perTripLimit?: number;
  requiresAttachment?: boolean;
  mileageCategory?: boolean;
  mileageRatePerKm?: number;
  active: number;
  createdDateTime?: string;
  modifiedDateTime?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface MileageConfig {
  site: string;
  ratePerKm: number;
  effectiveFrom: string;
}

export interface EmployeeBankDetails {
  accountHolder: string;
  bankName: string;
  accountNumberMasked: string;
  ifsc: string;
}
