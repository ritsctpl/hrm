import { test, expect } from '@playwright/test';
import { reportSignature, useHrmWorkforceStore } from '../../src/modules/hrmWorkforce/stores/hrmWorkforceStore';
import type { ReportQuery } from '../../src/modules/hrmWorkforce/types/ui.types';

/**
 * `reportSignature` is what stops a report panel showing the previous window's rows.
 *
 * Both report panels unmount whenever the section toggle moves away from them, so their "have I
 * loaded?" ref resets while the store slot stays full — and the range they share lives in one
 * `reportQuery` that the *other* section is free to change in the meantime. The panels therefore
 * decide whether to reload by comparing the signature their slot was loaded for against the
 * signature of the query in the bar. That comparison is this string, so these are the tests that
 * stand between the fix and its regression.
 *
 * The reported repro, verbatim: open Fleet Health (7-day rows land) → switch to Utilization →
 * widen the range to 30 days → switch back to Fleet Health. Before the fix the 7-day rows sat
 * under a 30-day bar.
 */

const q = (from: string, to: string, extra: Partial<ReportQuery> = {}): ReportQuery => ({
  from,
  to,
  ...extra,
});

const WEEK = q('2026-08-20', '2026-08-26');
const MONTH = q('2026-07-28', '2026-08-26');

test('the section-switch repro: a range widened on the other section invalidates this slot', () => {
  // The health slot was loaded for the week; the bar now asks for the month.
  expect(reportSignature(MONTH, 'health')).not.toBe(reportSignature(WEEK, 'health'));
  // ...and symmetrically, which is the half that is easy to leave broken.
  expect(reportSignature(MONTH, 'utilization')).not.toBe(reportSignature(WEEK, 'utilization'));
});

test('re-entering a section with the same query does NOT invalidate — no double fetch', () => {
  expect(reportSignature(WEEK, 'health')).toBe(reportSignature(q('2026-08-20', '2026-08-26'), 'health'));
  expect(reportSignature(WEEK, 'utilization')).toBe(
    reportSignature(q('2026-08-20', '2026-08-26'), 'utilization'),
  );
});

test('each slot ignores the filter the other endpoint owns', () => {
  // `employee-utilization` never sends `serialNumber`, so picking a device cannot change its answer
  // — invalidating the utilization slot there would be a re-fetch that provably alters no row.
  expect(reportSignature(q('2026-08-20', '2026-08-26', { serialNumber: 'PF5GJT06' }), 'utilization')).toBe(
    reportSignature(WEEK, 'utilization'),
  );
  // ...and `fleet-health` never sends `employeeId`.
  expect(reportSignature(q('2026-08-20', '2026-08-26', { employeeId: 'R10002' }), 'health')).toBe(
    reportSignature(WEEK, 'health'),
  );
});

test('each slot DOES react to its own filter', () => {
  expect(reportSignature(q('2026-08-20', '2026-08-26', { employeeId: 'R10002' }), 'utilization')).not.toBe(
    reportSignature(WEEK, 'utilization'),
  );
  expect(reportSignature(q('2026-08-20', '2026-08-26', { serialNumber: 'PF5GJT06' }), 'health')).not.toBe(
    reportSignature(WEEK, 'health'),
  );
  // Two different employees are two different answers.
  expect(reportSignature(q('2026-08-20', '2026-08-26', { employeeId: 'R10002' }), 'utilization')).not.toBe(
    reportSignature(q('2026-08-20', '2026-08-26', { employeeId: 'R10003' }), 'utilization'),
  );
});

test('a cleared filter and an unset one are the same query, not two', () => {
  // The bar hands back `undefined` on clear and the hook sends nothing; an empty string must not
  // read as a third state, or clearing the box would trigger a reload that changes no row.
  expect(reportSignature(q('2026-08-20', '2026-08-26', { employeeId: '' }), 'utilization')).toBe(
    reportSignature(q('2026-08-20', '2026-08-26', { employeeId: undefined }), 'utilization'),
  );
});

test('a half-built or absent query has one spelling', () => {
  // Never `undefined|undefined|...`: two different broken queries must not compare equal to each
  // other by accident, and none of them may compare equal to a real one.
  expect(reportSignature(undefined, 'health')).toBe('|||');
  expect(reportSignature({}, 'utilization')).toBe('|||');
  expect(reportSignature(WEEK, 'health')).not.toBe('|||');
});

test('the four-part shape is stable — it is persisted state, compared as a whole string', () => {
  expect(reportSignature(q('2026-08-20', '2026-08-26', { employeeId: 'R10002' }), 'utilization')).toBe(
    '2026-08-20|2026-08-26|R10002|',
  );
  expect(reportSignature(q('2026-08-20', '2026-08-26', { serialNumber: 'PF5GJT06' }), 'health')).toBe(
    '2026-08-20|2026-08-26||PF5GJT06',
  );
});

/**
 * The repro, replayed against the real store.
 *
 * The signature tests above pin the string; this one pins the decision the panels actually make
 * with it, using the store the screen uses and the mount predicate copied verbatim out of
 * `FleetHealthPanel` / `UtilizationPanel`. Without it, the two could drift — a correct signature
 * consulted by a predicate that no longer asks the right question is exactly how this bug shipped
 * the first time.
 */

/** Verbatim from `FleetHealthPanel`'s mount effect. */
const healthNeedsLoad = (): boolean => {
  const state = useHrmWorkforceStore.getState();
  return (
    (state.fleetHealth?.length ?? 0) === 0 ||
    state.fleetHealthLoadedFor !== reportSignature(state.reportQuery, 'health')
  );
};

/** Verbatim from `UtilizationPanel`'s mount effect. */
const utilizationNeedsLoad = (): boolean => {
  const state = useHrmWorkforceStore.getState();
  return (
    (state.utilization?.length ?? 0) === 0 ||
    state.utilizationLoadedFor !== reportSignature(state.reportQuery, 'utilization')
  );
};

test('repro closed: Fleet Health → widen the range on Utilization → back reloads', () => {
  const store = () => useHrmWorkforceStore.getState();

  // 1. Fleet Health is opened and the default week lands.
  store().setReportQuery({ from: '2026-08-20', to: '2026-08-26', employeeId: undefined, serialNumber: undefined });
  store().setFleetHealth([{ serialNumber: 'PF5GJT06' } as never]);
  store().setFleetHealthLoadedFor(reportSignature(store().reportQuery, 'health'));

  // Switching away and straight back, with nothing changed, must NOT refetch.
  expect(healthNeedsLoad()).toBe(false);

  // 2. On Utilization the user widens the range to 30 days — the same `reportQuery` both sections share.
  store().setReportQuery({ from: '2026-07-28', to: '2026-08-26' });

  // 3. Back on Fleet Health: the rows in the slot answer a window nobody is asking about any more.
  expect(healthNeedsLoad()).toBe(true);
});

test('repro closed in the other direction, and a failed load always retries', () => {
  const store = () => useHrmWorkforceStore.getState();

  store().setReportQuery({ from: '2026-08-20', to: '2026-08-26', employeeId: undefined, serialNumber: undefined });
  store().setUtilization([{ employeeId: 'R10002' } as never]);
  store().setUtilizationLoadedFor(reportSignature(store().reportQuery, 'utilization'));
  expect(utilizationNeedsLoad()).toBe(false);

  // A device picked over on the health section must not cost a reload here — utilization never
  // sends `serialNumber`, so not one row could change.
  store().setReportQuery({ serialNumber: 'PF5GJT06' });
  expect(utilizationNeedsLoad()).toBe(false);

  // A range widened over there must.
  store().setReportQuery({ from: '2026-07-28' });
  expect(utilizationNeedsLoad()).toBe(true);

  // And a load that FAILED holds no answer: the loader nulls the signature, so even a slot that
  // still has rows in it is asked again rather than trusted.
  store().setUtilizationLoadedFor(null);
  expect(utilizationNeedsLoad()).toBe(true);
});
