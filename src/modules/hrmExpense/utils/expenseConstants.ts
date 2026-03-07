import type { ExpenseStatus, ExpenseType } from "../types/domain.types";

export const EXPENSE_STATUS_COLORS: Record<ExpenseStatus, string> = {
  DRAFT: "default",
  PENDING_SUPERVISOR: "warning",
  ESCALATED: "volcano",
  PENDING_FINANCE: "processing",
  APPROVED: "success",
  REJECTED: "error",
  PAID: "cyan",
  CANCELLED: "default",
};

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  DRAFT: "Draft",
  PENDING_SUPERVISOR: "Pending Supervisor",
  ESCALATED: "Escalated",
  PENDING_FINANCE: "Pending Finance",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const EXPENSE_TYPE_COLORS: Record<ExpenseType, string> = {
  ADVANCE: "blue",
  REIMBURSEMENT: "green",
  MILEAGE: "purple",
};

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  ADVANCE: "Advance",
  REIMBURSEMENT: "Reimbursement",
  MILEAGE: "Mileage",
};

export const PAYMENT_MODE_OPTIONS = [
  { value: "NEFT", label: "NEFT" },
  { value: "IMPS", label: "IMPS" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CASH", label: "Cash" },
];

export const CANCELLABLE_STATUSES: ExpenseStatus[] = ["DRAFT", "PENDING_SUPERVISOR"];
export const RECALLABLE_STATUSES: ExpenseStatus[] = ["PENDING_SUPERVISOR", "ESCALATED"];

export const DEFAULT_EXPENSE_FORM: import("../types/ui.types").ExpenseFormState = {
  expenseType: null,
  purpose: "",
  travelRefHandle: null,
  fromDate: null,
  toDate: null,
  costCenter: "",
  projectCode: "",
  wbsCode: "",
  currency: "INR",
  exchangeRate: 1,
  outOfPolicyJustification: "",
};

export const DEFAULT_FINANCE_PANEL: import("../types/ui.types").FinancePanelState = {
  sanctionedAmount: null,
  perDiem: null,
  exchangeRate: 1,
  originalsReceived: false,
  paymentMode: null,
  paymentReference: "",
  paymentDate: null,
  remarks: "",
};
