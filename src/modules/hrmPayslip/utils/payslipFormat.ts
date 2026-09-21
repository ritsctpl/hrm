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

/**
 * Year options for the employee's own Year select. The currently selected year always appears —
 * even before the list has loaded, or for a deep-linked year with no rows yet — plus every year
 * present in the employee's own payslip list. Sorted newest first.
 */
export function myPayslipYearOptions(
  selectedYear: number,
  list: Array<{ payrollYear: number }>
): number[] {
  return Array.from(new Set([selectedYear, ...list.map((p) => p.payrollYear)])).sort(
    (a, b) => b - a
  );
}

/**
 * Whether the "My Payslips" view should ask the store to load a snapshot for the selected period
 * right now.
 *
 * `myPayslipList` is what tells `loadMySnapshot` whether a period is UPLOADED (no snapshot to
 * fetch) or GENERATED (fetch and render it). Until that list has loaded at least once, the answer
 * is unknown, and calling the endpoint for what turns out to be an uploaded month fails
 * (PAYSLIP_020) and leaves a "couldn't load your payslip" banner with nothing left to clear it —
 * the effect that loads the snapshot does not depend on the list, so it never runs again to
 * correct the mistake. Waiting for the list to finish loading removes that wrong call entirely,
 * rather than racing to clean up after it (preflight fix round 1, finding 1).
 */
export function shouldLoadMySnapshot(linkResolved: boolean, myPayslipListLoaded: boolean): boolean {
  return linkResolved && myPayslipListLoaded;
}

/** How an HR screen downloads one listed payslip. */
export type HrDownloadRoute =
  | { kind: "uploaded"; handle: string; fileName: string }
  | { kind: "generated"; handle: string };

/**
 * Routes an HR download of a listed payslip (Repository, and the Generate panel's distribution
 * list). Both screens list OTHER employees' payslips of either source, so neither may use the
 * self-service /downloadMyPayslip: it refuses another employee (403) and has no snapshot for an
 * uploaded row (PAYSLIP_020). Uploaded rows fetch their stored PDF by handle; everything else
 * renders from the HR snapshot by handle.
 */
export function hrDownloadRoute(record: {
  handle: string;
  employeeId: string | null;
  payrollYear: number;
  payrollMonth: number;
  source?: string | null;
  fileName?: string | null;
}): HrDownloadRoute {
  if (record.source === "UPLOADED") {
    return {
      kind: "uploaded",
      handle: record.handle,
      fileName: record.fileName
        ?? payslipFileName(record.employeeId, record.payrollYear, record.payrollMonth),
    };
  }
  return { kind: "generated", handle: record.handle };
}
