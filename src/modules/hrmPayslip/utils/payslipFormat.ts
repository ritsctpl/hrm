import { numberToWords } from "./numberToWords";

/**
 * Payslip number and date formatting, matching the source document exactly.
 *
 * These are not cosmetic choices — they are copied from `R10197_Jul-2026.pdf`, which is the format
 * the operator asked to reproduce.
 */

/** `₹22,948` — Indian digit grouping, whole rupees. A zero renders as `-`, never `₹0`. */
export function payslipAmount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number(value) === 0) return "-";
  return "₹" + Math.round(Number(value)).toLocaleString("en-IN");
}

/** The NET PAY band prints the figure without the symbol; the symbol sits in its own cell. */
export function payslipNetAmount(value: number | null | undefined): string {
  return Math.round(Number(value ?? 0)).toLocaleString("en-IN");
}

/**
 * `(Rupees Twenty Thousand Nine Hundred Forty Eight Only)`.
 *
 * Reuses the existing Indian crore/lakh/thousand conversion and only reorders the words: that
 * helper returns "… Rupees Only", the payslip prints "(Rupees … Only)".
 */
export function payslipAmountInWords(value: number | null | undefined): string {
  const words = numberToWords(Math.round(Number(value ?? 0)));
  const core = words.replace(/\s*Rupees\s*Only\s*$/i, "").replace(/\s*Only\s*$/i, "").trim();
  return `(Rupees ${core} Only)`;
}

/** `02-Feb-2026`, as the source payslip prints joining dates. */
export function payslipDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

/** `Jul-2026` — the period label in the blue header band. */
export function payslipPeriod(year: number, month: number, fallback?: string | null): string {
  if (!year || !month) return fallback ?? "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[month - 1]}-${year}`;
}

/** `<EmpID>_<Mon-YYYY>.pdf` — the same file name the macro produced. */
export function payslipFileName(employeeId: string | null, year: number, month: number): string {
  return `${employeeId ?? "payslip"}_${payslipPeriod(year, month)}.pdf`;
}
