import dayjs from "dayjs";
// Side-effect import: dateHelpers extends dayjs with customParseFormat so we
// can parse both DD/MM/YYYY (header picker output) and YYYY-MM-DD (server
// payload) reliably.
import "./dateHelpers";
import type { ExpenseFormState } from "../types/ui.types";
import type { ExpenseItem, ExpenseCategory } from "../types/domain.types";

/**
 * Parse an expense date string that may be in either DD/MM/YYYY (picker
 * format) or YYYY-MM-DD (server format). Returns null if neither matches.
 * Without this, dayjs falls back to native Date parsing which interprets
 * "02/06/2026" as Feb 6, not Jun 2 — leading to false "out of range" errors.
 */
function parseExpenseDate(value: string | null | undefined): dayjs.Dayjs | null {
  if (!value) return null;
  const ddmmyyyy = dayjs(value, "DD/MM/YYYY", true);
  if (ddmmyyyy.isValid()) return ddmmyyyy;
  const iso = dayjs(value, "YYYY-MM-DD", true);
  if (iso.isValid()) return iso;
  // Fall through to lenient parsing as a last resort.
  const lenient = dayjs(value);
  return lenient.isValid() ? lenient : null;
}

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
  field: "expenseDate" | "amount" | "attachment";
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
  if (form.fromDate && form.toDate) {
    const from = parseExpenseDate(form.fromDate);
    const to = parseExpenseDate(form.toDate);
    if (from && to && to.isBefore(from, "day")) {
      errors.dateRange = "To date must be on or after From date.";
    }
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

    // BR6: per-trip / daily limit breaches are soft — surfaced via item.outOfPolicy
    // and gated by BR1 (justification required). Submit proceeds with justification
    // and the approver reviews the breach.

    // BR2: receipt required when category.requiresAttachment.
    if (cat?.requiresAttachment && !item.attachmentRefs?.length) {
      errors.push({
        handle: item.handle,
        field: "attachment",
        message: `A receipt is required for category ${cat.categoryName}.`,
      });
    }

    // BR8: item expenseDate must fall within [fromDate, toDate]
    if (item.expenseDate && (fromDate || toDate)) {
      const d = parseExpenseDate(item.expenseDate);
      const from = parseExpenseDate(fromDate);
      const to = parseExpenseDate(toDate);
      if (d && from && d.isBefore(from, "day")) {
        errors.push({
          handle: item.handle,
          field: "expenseDate",
          message: "Item date is before the report From date.",
        });
      } else if (d && to && d.isAfter(to, "day")) {
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
