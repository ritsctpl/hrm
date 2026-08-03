import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(relativeTime);

/**
 * Backend timestamps are zoneless — read them as UTC.
 *
 * The API serializes Java `LocalDateTime` with no offset ("2026-08-03T05:50:39")
 * while the server clock runs on UTC. Handing that string to `dayjs()` makes
 * the browser read it as *local* wall-clock time, so in IST (+5:30) an
 * announcement published seconds ago renders as "6 hours ago" — the 5.5 hour
 * offset rounded up. Every timestamp is wrong by exactly the viewer's offset,
 * which is why it looks like a fixed number rather than a broken clock.
 *
 * Parsing as UTC and converting back to local fixes both display and
 * comparison. Values that *do* carry a Z or an offset parse correctly through
 * the same path, so this is safe to use on any datetime the API returns.
 */
export const toLocalDateTime = (value?: string | null): Dayjs | null => {
  if (!value) return null;
  const parsed = dayjs.utc(value).local();
  return parsed.isValid() ? parsed : null;
};

/**
 * Date-only values (Java `LocalDate`, "2026-08-10") must NOT go through the
 * UTC conversion: midnight UTC shifted into a behind-UTC zone lands on the
 * previous day, silently moving a deadline. A calendar date means the same
 * date everywhere, so parse it as written.
 */
export const parseDateOnly = (value?: string | null): Dayjs | null => {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

/** Formatted local time, or "" so callers can render it unguarded. */
export const formatDateTime = (
  value?: string | null,
  format = "DD-MMM-YYYY HH:mm"
): string => toLocalDateTime(value)?.format(format) ?? "";

/** "3 minutes ago", in the reader's own timezone. */
export const fromNow = (value?: string | null): string =>
  toLocalDateTime(value)?.fromNow() ?? "";

/** True when a backend timestamp is in the past — deadlines, SLA breaches. */
export const isPast = (value?: string | null): boolean => {
  const parsed = toLocalDateTime(value);
  return !!parsed && parsed.isBefore(dayjs());
};
