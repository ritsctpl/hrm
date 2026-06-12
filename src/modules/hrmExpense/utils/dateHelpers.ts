/**
 * Shared date helpers for the HRM Expense module.
 *
 * The form layer stores and displays dates in `DD/MM/YYYY`, while the
 * backend exclusively accepts `YYYY-MM-DD`. Without a consistent
 * normalization step at the boundary, date strings round-trip incorrectly
 * (Invalid Date displays, 500 errors on save, filter mismatches).
 *
 * The dayjs plugins below are required for AntD v5 DatePicker to render
 * calendar cells. Without them, every cell renders the literal text
 * "Invalid Date".
 */

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(customParseFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);

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

/**
 * Parse an expense date that may be in EITHER `DD/MM/YYYY` (picker output)
 * or `YYYY-MM-DD` (server payload) into a dayjs object.
 *
 * Line items round-trip through both shapes: a freshly picked date is stored
 * as `DD/MM/YYYY`, while items loaded from `/expense/get` carry the server's
 * `YYYY-MM-DD`. Parsing strictly with a single format makes the other shape
 * render as "Invalid Date" in the picker / cell. Try both strict formats,
 * then fall back to lenient parsing so neither representation breaks.
 */
export function parseFlexibleDate(
  dateStr: string | null | undefined
): dayjs.Dayjs | null {
  if (!dateStr) return null;
  const display = dayjs(dateStr, DATE_DISPLAY_FORMAT, true);
  if (display.isValid()) return display;
  const iso = dayjs(dateStr, DATE_API_FORMAT, true);
  if (iso.isValid()) return iso;
  const lenient = dayjs(dateStr);
  return lenient.isValid() ? lenient : null;
}
