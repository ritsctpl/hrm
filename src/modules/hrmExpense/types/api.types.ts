import type { ExpenseStatus, ExpenseType, PaymentMode } from "./domain.types";

export interface SiteRequest {
  site: string;
}

export interface ExpenseListRequest {
  site: string;
  employeeId: string;
  expenseType?: ExpenseType;
  status?: ExpenseStatus;
  searchTerm?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ExpenseApproverInboxRequest {
  site: string;
  approverId: string;
  inboxType: "PENDING" | "ESCALATED" | "DECIDED";
  role: "SUPERVISOR" | "FINANCE";
  expenseType?: ExpenseType;
  fromDate?: string;
  toDate?: string;
}

export interface GetExpenseByHandleRequest {
  site: string;
  handle: string;
}

export interface ExpenseCreatePayload {
  site: string;
  employeeId: string;
  expenseType: ExpenseType;
  purpose: string;
  travelRefHandle?: string;
  fromDate: string;
  toDate: string;
  costCenter: string;
  projectCode?: string;
  wbsCode?: string;
  currency: string;
  exchangeRate: number;
  outOfPolicyJustification?: string;
}

export interface ExpenseUpdatePayload extends ExpenseCreatePayload {
  handle: string;
}

export interface ExpenseLineItemPayload {
  handle: string;
  site: string;
  lineItemId?: string;
  expenseDate: string;
  categoryCode: string;
  description: string;
  amount: number;
  currency: string;
}

export interface MileageLineItemPayload {
  handle: string;
  site: string;
  lineItemId?: string;
  tripDate: string;
  fromLocation: string;
  toLocation: string;
  distanceKm: number;
}

export interface ExpenseSubmitRequest {
  site: string;
  handle: string;
}

export interface ExpenseApprovalPayload {
  site: string;
  handle: string;
  approverId: string;
  remarks?: string;
}

export interface ExpenseRejectPayload {
  site: string;
  handle: string;
  approverId: string;
  remarks: string;
}

export interface ExpenseFinanceSanctionPayload {
  site: string;
  handle: string;
  financeId: string;
  sanctionedAmount: number;
  perDiem?: number;
  exchangeRate?: number;
  originalsReceived: boolean;
  remarks?: string;
}

export interface ExpensePaymentPayload {
  site: string;
  handle: string;
  financeId: string;
  paymentMode: PaymentMode;
  paymentReference: string;
  paymentDate: string;
  remarks?: string;
}

export interface ExpenseCancelRequest {
  site: string;
  handle: string;
  reason: string;
}

export interface MileageCalculateRequest {
  site: string;
  distanceKm: number;
}
