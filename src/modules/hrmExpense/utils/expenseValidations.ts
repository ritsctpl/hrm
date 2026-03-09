import type { ExpenseFormState } from "../types/ui.types";

export interface ExpenseFormErrors {
  expenseType?: string;
  purpose?: string;
  fromDate?: string;
  toDate?: string;
  costCenter?: string;
  currency?: string;
  outOfPolicyJustification?: string;
}

export function validateExpenseForm(form: ExpenseFormState): ExpenseFormErrors {
  const errors: ExpenseFormErrors = {};
  if (!form.expenseType) errors.expenseType = "Expense type is required.";
  if (!form.purpose.trim()) errors.purpose = "Purpose is required.";
  if (!form.fromDate) errors.fromDate = "From date is required.";
  if (!form.toDate) errors.toDate = "To date is required.";
  if (!form.costCenter.trim()) errors.costCenter = "Cost center is required.";
  if (!form.currency.trim()) errors.currency = "Currency is required.";
  return errors;
}

export function isExpenseFormValid(form: ExpenseFormState, itemsCount = 0): boolean {
  if (itemsCount <= 0) return false;
  return Object.keys(validateExpenseForm(form)).length === 0;
}
