import { test, expect } from '@playwright/test';
import { shouldLoadMySnapshot } from '../../src/modules/hrmPayslip/utils/payslipFormat';

/**
 * shouldLoadMySnapshot (task 12 fix round 1, finding 1).
 *
 * loadMySnapshot decides whether a period is UPLOADED by looking it up in myPayslipList. Calling
 * it before that list has loaded even once -- on first render, or right after a deep link -- makes
 * it wrongly treat an uploaded month as generated: the snapshot fetch fails (PAYSLIP_020) and sets
 * an error banner that nothing ever clears, because the effect that calls loadMySnapshot does not
 * depend on the list. This guard is what the effect checks before calling loadMySnapshot at all,
 * so the wrong call never happens in the first place.
 */

test('waits when the deep-link parameters have not resolved yet', () => {
  expect(shouldLoadMySnapshot(false, true)).toBe(false);
});

test('waits when the payslip list has not loaded yet, even if the link has resolved', () => {
  expect(shouldLoadMySnapshot(true, false)).toBe(false);
});

test('waits when neither has happened yet', () => {
  expect(shouldLoadMySnapshot(false, false)).toBe(false);
});

test('loads once both the link and the list have resolved', () => {
  expect(shouldLoadMySnapshot(true, true)).toBe(true);
});
