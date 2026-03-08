import type { ExpenseType } from "./domain.types";

export type ExpenseScreenMode = "list" | "create" | "view" | "edit";

export type ExpenseDetailTab = "header" | "lineitems" | "attachments" | "timeline";

export type ExpenseInboxTab = "pending" | "escalated" | "decided";

export interface ExpenseFormState {
  expenseType: ExpenseType | null;
  purpose: string;
  travelRequestHandle: string | null;
  fromDate: string | null;
  toDate: string | null;
  costCenter: string;
  projectCode: string;
  wbsCode: string;
  currency: string;
  exchangeRate: number;
  outOfPolicyJustification: string;
}

export interface ExpenseLineItemFormState {
  handle?: string;
  expenseDate: string | null;
  categoryId: string | null;
  description: string;
  amount: number | null;
  currency: string;
}

export interface MileageLineItemFormState {
  handle?: string;
  tripDate: string | null;
  fromLocation: string;
  toLocation: string;
  distanceKm: number | null;
}

export interface FinancePanelState {
  sanctionedAmount: number | null;
  perDiemAmount: number | null;
  exchangeRate: number;
  originalsReceived: boolean;
  paymentMode: string | null;
  paymentReference: string;
  paymentDate: string | null;
  remarks: string;
}
