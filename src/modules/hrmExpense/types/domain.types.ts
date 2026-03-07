export type ExpenseStatus =
  | "DRAFT"
  | "PENDING_SUPERVISOR"
  | "ESCALATED"
  | "PENDING_FINANCE"
  | "APPROVED"
  | "REJECTED"
  | "PAID"
  | "CANCELLED";

export type ExpenseType = "ADVANCE" | "REIMBURSEMENT" | "MILEAGE";

export type PaymentMode = "NEFT" | "IMPS" | "CHEQUE" | "CASH";

export interface ExpenseReport {
  handle: string;
  reportId: string;
  site: string;
  employeeId: string;
  employeeName: string;
  expenseType: ExpenseType;
  purpose: string;
  travelRefHandle?: string;
  travelRefId?: string;
  travelRefSummary?: string;
  fromDate: string;
  toDate: string;
  costCenter: string;
  projectCode?: string;
  wbsCode?: string;
  currency: string;
  exchangeRate: number;
  totalClaimedAmount: number;
  totalClaimedInr: number;
  sanctionedAmount?: number;
  perDiem?: number;
  outOfPolicy: boolean;
  outOfPolicyJustification?: string;
  originalsReceived: boolean;
  paymentMode?: PaymentMode;
  paymentReference?: string;
  paymentDate?: string;
  financeRemarks?: string;
  lineItems: ExpenseLineItem[];
  mileageItems: MileageLineItem[];
  attachments: ExpenseAttachment[];
  actionHistory: ExpenseAction[];
  status: ExpenseStatus;
  currentApproverId?: string;
  currentApproverName?: string;
  escalationLevel: number;
  slaDeadline?: string;
  slaBreached: boolean;
  submittedAt?: string;
  createdDateTime: string;
  createdBy: string;
  active: number;
}

export interface ExpenseLineItem {
  lineItemId: string;
  expenseDate: string;
  categoryCode: string;
  categoryName: string;
  description: string;
  amount: number;
  currency: string;
  amountInr: number;
  outOfPolicy: boolean;
  policyLimit?: number;
  receiptAttachmentId?: string;
}

export interface MileageLineItem {
  lineItemId: string;
  tripDate: string;
  fromLocation: string;
  toLocation: string;
  distanceKm: number;
  ratePerKm: number;
  amount: number;
}

export interface ExpenseAttachment {
  attachmentId: string;
  fileName: string;
  fileSizeBytes: number;
  linkedLineItemId?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ExpenseAction {
  actionId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  remarks?: string;
  actionDateTime: string;
}

export interface ExpenseCategory {
  handle: string;
  site: string;
  code: string;
  name: string;
  dailyLimitInr?: number;
  requiresReceipt: boolean;
  active: boolean;
  sortOrder: number;
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
