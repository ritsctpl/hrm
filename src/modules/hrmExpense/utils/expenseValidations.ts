import dayjs from "dayjs";
import type { ExpenseFormState } from "../types/ui.types";
import type { ExpenseItem, ExpenseCategory } from "../types/domain.types";

export interface ExpenseFormErrors {
  expenseType?: string;
  purpose?: string;
  fromDate?: string;
  toDate?: string;
  costCenter?: string;
  currency?: string;
  outOfPolicyJustification?: string;
  dateRange?: string;
}

export interface LineItemValidationContext {
  categories: ExpenseCategory[];
  fromDate?: string | null;
  toDate?: string | null;
}

export interface LineItemError {
  handle: string;
  field: "expenseDate" | "amount" | "attachment" | "perTripLimit";
  message: string;
}

export function validateExpenseForm(
  form: ExpenseFormState,
  items: ExpenseItem[] = [],
): ExpenseFormErrors {
  const errors: ExpenseFormErrors = {};
  if (!form.expenseType) errors.expenseType = "Expense type is required.";
  if (!form.purpose.trim()) errors.purpose = "Purpose is required.";
  if (!form.fromDate) errors.fromDate = "From date is required.";
  if (!form.toDate) errors.toDate = "To date is required.";
  if (!form.costCenter.trim()) errors.costCenter = "Cost center is required.";
  if (!form.currency.trim()) errors.currency = "Currency is required.";

  // BR7: fromDate must be on or before toDate
  if (form.fromDate && form.toDate && dayjs(form.toDate).isBefore(dayjs(form.fromDate), "day")) {
    errors.dateRange = "To date must be on or after From date.";
  }

  // BR1: OOP justification required when any item is flagged out-of-policy
  const hasOop = items.some((it) => it.outOfPolicy);
  if (hasOop && !form.outOfPolicyJustification.trim()) {
    errors.outOfPolicyJustification =
      "Justification is required when any line item exceeds policy limits.";
  }

  return errors;
}

export function validateLineItems(
  items: ExpenseItem[],
  ctx: LineItemValidationContext,
): LineItemError[] {
  const errors: LineItemError[] = [];
  const { categories, fromDate, toDate } = ctx;

  items.forEach((item) => {
    const cat = categories.find(
      (c) => c.categoryCode === item.categoryId || c.handle === item.categoryId,
    );

    // BV2: amount must be strictly > 0
    if (!item.amount || item.amount <= 0) {
      errors.push({
        handle: item.handle,
        field: "amount",
        message: "Amount must be greater than zero.",
      });
    }

    // BR6: perTripLimit enforcement
    if (cat?.perTripLimit != null && item.amount > cat.perTripLimit) {
      errors.push({
        handle: item.handle,
        field: "perTripLimit",
        message: `Amount exceeds per-trip limit of ${cat.perTripLimit} for category ${cat.categoryName}.`,
      });
    }

    // BR2: receipt required when category.requiresAttachment
    if (cat?.requiresAttachment && !item.attachmentRef) {
      errors.push({
        handle: item.handle,
        field: "attachment",
        message: `A receipt is required for category ${cat.categoryName}.`,
      });
    }

    // BR8: item expenseDate must fall within [fromDate, toDate]
    if (item.expenseDate && (fromDate || toDate)) {
      const d = dayjs(item.expenseDate);
      if (fromDate && d.isBefore(dayjs(fromDate), "day")) {
        errors.push({
          handle: item.handle,
          field: "expenseDate",
          message: "Item date is before the report From date.",
        });
      } else if (toDate && d.isAfter(dayjs(toDate), "day")) {
        errors.push({
          handle: item.handle,
          field: "expenseDate",
          message: "Item date is after the report To date.",
        });
      }
    }
  });

  return errors;
}

export function isExpenseFormValid(
  form: ExpenseFormState,
  items: ExpenseItem[] = [],
  categories: ExpenseCategory[] = [],
): boolean {
  if (items.length <= 0) return false;
  const formErrors = validateExpenseForm(form, items);
  if (Object.keys(formErrors).length > 0) return false;
  const itemErrors = validateLineItems(items, {
    categories,
    fromDate: form.fromDate,
    toDate: form.toDate,
  });
  return itemErrors.length === 0;
}
