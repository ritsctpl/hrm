import { test, expect } from '@playwright/test';
import { rangeIncluding } from '../../src/modules/hrmWorkforce/components/organisms/FinalizeDayModal';
import type { AttendanceQuery } from '../../src/modules/hrmWorkforce/types/ui.types';

/**
 * `rangeIncluding` decides which attendance window is on screen after a day is finalized.
 *
 * It is pure, but it is mutation-adjacent: `FinalizeDayModal` writes its result into the store
 * *before* awaiting `finalize(date)`, because the hook reloads attendance over the *stored* range
 * rather than over the day it just wrote. Get this wrong in the "already inside" direction and a
 * successful finalize refreshes the table to exactly the rows it already had — the operator's only
 * evidence is that nothing changed. Get it wrong in the widening direction and the reload is a
 * request the backend rejects, so a finalize that succeeded reports a failed refresh.
 *
 * <b>The 92-day boundary is the load-bearing assertion.</b> `AttendanceController` computes
 * `days = ChronoUnit.DAYS.between(from, to) + 1` and throws when `days > MAX_RANGE_DAYS (92)` — so
 * a 92-day window is accepted and a 93-day one is not. The helper's `span <= 92` has to mean the
 * same thing as the backend's `days > 92`, and the two off-by-one opportunities (inclusive span vs.
 * exclusive diff, `>` vs. `>=`) are pinned below with dates either side of the line. A drift here is
 * invisible to `tsc` and only shows up as a 400 on the one path an operator uses after a failed
 * nightly sweep.
 */

const q = (from: string, to: string, employeeId?: string): AttendanceQuery =>
  employeeId ? { from, to, employeeId } : { from, to };

test('a date already inside the range moves nothing — endpoints included', () => {
  // `null` is "leave the window alone". Both endpoints are inside: finalizing the first or last day
  // of the window on screen must not shuffle it.
  expect(rangeIncluding(q('2026-08-20', '2026-08-26'), '2026-08-23')).toBeNull();
  expect(rangeIncluding(q('2026-08-20', '2026-08-26'), '2026-08-20')).toBeNull();
  expect(rangeIncluding(q('2026-08-20', '2026-08-26'), '2026-08-26')).toBeNull();
});

test('a date just outside widens the window in that direction, keeping the other end', () => {
  // Backwards: the surrounding days the operator was looking at stay on screen.
  expect(rangeIncluding(q('2026-08-20', '2026-08-26'), '2026-08-18')).toEqual({
    from: '2026-08-18',
    to: '2026-08-26',
  });
  // Forwards: same rule, other end.
  expect(rangeIncluding(q('2026-08-01', '2026-08-10'), '2026-08-15')).toEqual({
    from: '2026-08-01',
    to: '2026-08-15',
  });
});

test('the employee filter survives a widen', () => {
  // Widening is about dates. A window that quietly dropped the employee filter would answer a
  // different question than the one on screen a moment earlier.
  expect(rangeIncluding(q('2026-08-20', '2026-08-26', 'R10002'), '2026-08-18')).toEqual({
    from: '2026-08-18',
    to: '2026-08-26',
    employeeId: 'R10002',
  });
});

test('the 92-day boundary: span 92 widens, span 93 snaps to the single day', () => {
  // 2026-05-27 → 2026-08-26 is exactly 92 days inclusive — the largest range the backend accepts,
  // so it is widened rather than snapped.
  expect(rangeIncluding(q('2026-08-20', '2026-08-26'), '2026-05-27')).toEqual({
    from: '2026-05-27',
    to: '2026-08-26',
  });

  // One day earlier is 93 — the request would 400 (`days > MAX_RANGE_DAYS`), so the window collapses
  // to the day the operator actually asked about, which is the one the finalize just wrote.
  expect(rangeIncluding(q('2026-08-20', '2026-08-26'), '2026-05-26')).toEqual({
    from: '2026-05-26',
    to: '2026-05-26',
  });

  // The same boundary forwards, so the snap is not accidentally a backwards-only rule.
  expect(rangeIncluding(q('2026-05-27', '2026-06-02'), '2026-08-26')).toEqual({
    from: '2026-05-27',
    to: '2026-08-26',
  });
  expect(rangeIncluding(q('2026-05-26', '2026-06-02'), '2026-08-26')).toEqual({
    from: '2026-08-26',
    to: '2026-08-26',
  });
});

test('a snap carries the employee filter too', () => {
  expect(rangeIncluding(q('2026-08-20', '2026-08-26', 'R10002'), '2026-05-26')).toEqual({
    from: '2026-05-26',
    to: '2026-05-26',
    employeeId: 'R10002',
  });
});

test('missing, blank or unparsable bounds snap to the single day — never silently widen to "now"', () => {
  // The trap this guards: `dayjs(undefined)` is *today*, so a missing bound that was parsed rather
  // than rejected would produce a valid-looking window nobody asked for — and the reload would then
  // show a range the picker above it does not claim.
  const bad = (query: unknown) => rangeIncluding(query as AttendanceQuery, '2026-08-26');

  expect(bad(undefined)).toEqual({ from: '2026-08-26', to: '2026-08-26' });
  expect(bad({})).toEqual({ from: '2026-08-26', to: '2026-08-26' });
  expect(bad({ from: '2026-08-20' })).toEqual({ from: '2026-08-26', to: '2026-08-26' });
  expect(bad({ from: '', to: '' })).toEqual({ from: '2026-08-26', to: '2026-08-26' });
  expect(bad({ from: 'not-a-date', to: 'also-not' })).toEqual({
    from: '2026-08-26',
    to: '2026-08-26',
  });
  // A bound of the wrong *type* (a stale persisted value, a hand-edited store) is not a date either.
  expect(bad({ from: 20260820, to: 20260826 })).toEqual({ from: '2026-08-26', to: '2026-08-26' });
});

test('an unparsable query keeps whatever else it carried', () => {
  // The snap is a date decision; the rest of the query is passed through untouched.
  expect(
    rangeIncluding({ from: '', to: '', employeeId: 'R10002' } as AttendanceQuery, '2026-08-26'),
  ).toEqual({ from: '2026-08-26', to: '2026-08-26', employeeId: 'R10002' });
});
