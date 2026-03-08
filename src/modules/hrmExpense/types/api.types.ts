import type { ExpenseType, PaymentMode } from "./domain.types";

export interface SiteRequest {
  site: string;
}

export interface ExpenseListRequest {
  site: string;
  employeeId?: string;
  expenseType?: ExpenseType;
  status?: string;
  searchTerm?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ExpenseApproverInboxRequest {
  site: string;
  empId: string;
}

export interface GetExpenseByHandleRequest {
  handle: string;
}

export interface ExpenseItemDto {
  categoryId: string;
  expenseDate: string;
  description: string;
  amount?: number;
  currency: string;
  fromLocation?: string;
  toLocation?: string;
  distanceKm?: number;
  attachmentRef?: string;
}

export interface ExpenseCreatePayload {
  site: string;
  expenseType: ExpenseType;
  purpose: string;
  travelRequestHandle?: string;
  costCenter?: string;
  projectCode?: string;
  wbsCode?: string;
  currency: string;
  fromDate: string;
  toDate: string;
  outOfPolicyJustification?: string;
  items: ExpenseItemDto[];
  attachmentRefs?: string[];
  createdBy: string;
}

export interface ExpenseUpdatePayload {
  handle: string;
  data: {
    site: string;
    expenseType: ExpenseType;
    purpose: string;
    currency: string;
    fromDate: string;
    toDate: string;
    costCenter?: string;
    projectCode?: string;
    wbsCode?: string;
    outOfPolicyJustification?: string;
    items: ExpenseItemDto[];
    createdBy: string;
  };
}

export interface ExpenseSubmitRequest {
  site: string;
  handle: string;
  submittedBy: string;
}

export interface ExpenseApprovalPayload {
  site: string;
  expenseRequestHandle: string;
  action: "APPROVE" | "REJECT";
  remarks?: string;
  actorEmpId: string;
  actorName: string;
}

export interface ExpenseRejectPayload {
  site: string;
  expenseRequestHandle: string;
  action: "REJECT";
  remarks: string;
  actorEmpId: string;
  actorName: string;
}

export interface ExpenseFinanceSanctionPayload {
  site: string;
  expenseRequestHandle: string;
  action: "APPROVE";
  sanctionedAmount?: number;
  perDiemAmount?: number;
  exchangeRate?: number;
  originalsReceived?: boolean;
  remarks?: string;
  actorEmpId: string;
  actorName: string;
}

export interface ExpensePaymentPayload {
  site: string;
  expenseRequestHandle: string;
  action: "PAY";
  paymentReference: string;
  paymentMode: PaymentMode;
  paymentDate: string;
  sanctionedAmount?: number;
  remarks?: string;
  actorEmpId: string;
  actorName: string;
}

export interface ExpenseCancelRequest {
  site: string;
  handle: string;
  reason: string;
}

export interface ExpenseRecallRequest {
  site: string;
  expenseId: string;
  recalledBy: string;
  reason: string;
}

export interface ExpenseDeleteRequest {
  site: string;
  expenseId: string;
  deletedBy: string;
}

export interface MileageCalculateRequest {
  site: string;
  categoryId: string;
  distanceKm: number;
}

export interface MileageCalculateResponse {
  distanceKm: number;
  ratePerKm: number;
  calculatedAmount: number;
}

// ── Originals Received ──────────────────────────────────────────────

export interface MarkOriginalsReceivedRequest {
  handle: string;
  received: boolean;
  markedBy: string;
}

// ── Unsettled Advances ──────────────────────────────────────────────

export interface GetUnsettledAdvancesRequest {
  site: string;
  empId: string;
}

export interface UnsettledAdvance {
  handle: string;
  travelHandle: string;
  travelPurpose: string;
  amount: number;
  currency: string;
  approvedAt: string;
  daysOutstanding: number;
}

// ── Category ──────────────────────────────────────────────────

export interface ExpenseCategorySavePayload {
  site: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  dailyLimit?: number;
  perTripLimit?: number;
  requiresAttachment?: boolean;
  mileageCategory?: boolean;
  mileageRatePerKm?: number;
  createdBy: string;
}

export interface ExpenseCategoryDeleteRequest {
  site: string;
  categoryId: string;
  deletedBy: string;
}

// ── Export ──────────────────────────────────────────────────

export interface ExpenseExportRequest {
  site: string;
  startDate: string;
  endDate: string;
  status?: string;
}

// ── Receipt Upload ──────────────────────────────────────────────────

export interface ReceiptUploadResponse {
  expenseItemHandle: string;
  receiptUrl: string;
  fileName: string;
  fileSize: number;
}
