// src/modules/hrmWorkforce/utils/workforceFormat.ts
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/**
 * Minutes → `h:mm`, the only way this module renders a duration.
 *
 * Attendance arrives as whole minutes (`presentMinutes: 429`) and a raw 429 on screen reads as a
 * count, not a working day. Anything that is not a positive finite number renders `0:00` rather
 * than `NaN:NaN`: a day the collector never wrote comes back null, and a person who was absent and
 * a field that failed to arrive both mean "no time", so neither may render as an error.
 */
export function fmtMinutes(min: number): string {
  const m = Number.isFinite(min) && min > 0 ? Math.floor(min) : 0;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

/**
 * A percentage, or an em dash when there is no reading.
 *
 * The health metrics are nullable all the way from the agent (a sensor it could not read reports
 * nothing), and a substituted `0%` would render as "no disk space left" or "the battery is dead" —
 * a fabricated alarm is worse than an absent reading, so the absence is shown as an absence.
 */
export function fmtPct(n: number | null | undefined): string {
  return n === null || n === undefined || !Number.isFinite(n) ? '—' : `${Math.round(n)}%`;
}

/**
 * "3 minutes ago" for a last-seen instant — never the string `Invalid Date`.
 *
 * A device that has never heartbeated carries a null `lastSeenAt`, and that is exactly the row an
 * IT team is looking for, so it must still render.
 */
export function fromNowSafe(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = dayjs(iso);
  return d.isValid() ? d.fromNow() : '—';
}
