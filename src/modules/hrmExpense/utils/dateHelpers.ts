/**
 * Shared date helpers for the HRM Expense module.
 *
 * The form layer stores and displays dates in `DD/MM/YYYY`, while the
 * backend exclusively accepts `YYYY-MM-DD`. Without a consistent
 * normalization step at the boundary, date strings round-trip incorrectly
 * (Invalid Date displays, 500 errors on save, filter mismatches).
 */

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export const DATE_DISPLAY_FORMAT = 'DD/MM/YYYY';
export const DATE_API_FORMAT = 'YYYY-MM-DD';

/** Convert a `DD/MM/YYYY` string to ISO `YYYY-MM-DD` for API payloads. */
export function normalizeDateToISO(dateStr: string | null | undefined): string | undefined {
  if (!dateStr) return undefined;
  const parsed = dayjs(dateStr, DATE_DISPLAY_FORMAT, true);
  return parsed.isValid() ? parsed.format(DATE_API_FORMAT) : undefined;
}

/** Parse a stored `DD/MM/YYYY` string into a dayjs object for AntD DatePicker. */
export function parseDateForPicker(
  dateStr: string | null | undefined,
  format: string = DATE_DISPLAY_FORMAT
): dayjs.Dayjs | null {
  if (!dateStr) return null;
  const parsed = dayjs(dateStr, format, true);
  return parsed.isValid() ? parsed : null;
}
