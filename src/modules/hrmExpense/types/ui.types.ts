import type { ExpenseType } from "./domain.types";

export type ExpenseScreenMode = "list" | "create" | "view" | "edit";

export type ExpenseDetailTab = "header" | "lineitems" | "attachments" | "timeline";

export type ExpenseInboxTab = "pending" | "escalated" | "decided";

export interface ExpenseFormState {
  expenseType: ExpenseType | null;
  purpose: string;
  travelRefHandle: string | null;
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
  lineItemId?: string;
  expenseDate: string | null;
  categoryCode: string | null;
  description: string;
  amount: number | null;
  currency: string;
}

export interface MileageLineItemFormState {
  lineItemId?: string;
  tripDate: string | null;
  fromLocation: string;
  toLocation: string;
  distanceKm: number | null;
}

export interface FinancePanelState {
  sanctionedAmount: number | null;
  perDiem: number | null;
  exchangeRate: number;
  originalsReceived: boolean;
  paymentMode: string | null;
  paymentReference: string;
  paymentDate: string | null;
  remarks: string;
}
