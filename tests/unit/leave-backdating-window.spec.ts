import { test, expect } from '@playwright/test';
import {
  earliestAllowedLeaveStart,
  isBackdatedBeyondWindow,
  PREVIOUS_MONTH_GRACE_DAYS,
} from '../../src/modules/hrmLeave/utils/backdating';

/**
 * HRM issue #3: "Couldn't submit the backdated leave." The form let HR submit any past date
 * ("HR Override … Submitting as HR"), the server then refused it. Decision: nobody, HR
 * included, may submit leave older than the current month + last 10 days of the previous
 * month. The window must be the backend's floor exactly (LeaveBackdatingRules):
 *   graceStart = today.withDayOfMonth(1).minusDays(10); allowed iff start >= graceStart.
 */
test.describe('backdated leave window', () => {
  test('grace is 10 days, as on the server', () => {
    expect(PREVIOUS_MONTH_GRACE_DAYS).toBe(10);
  });

  test('anywhere in September 2026 the earliest start is 22 Aug (the last 10 days of August)', () => {
    for (const today of ['2026-09-01', '2026-09-21', '2026-09-30']) {
      expect(earliestAllowedLeaveStart(today)).toBe('2026-08-22');
    }
  });

  test('the boundary day is allowed, the day before is blocked', () => {
    expect(isBackdatedBeyondWindow('2026-08-22', '2026-09-21')).toBe(false);
    expect(isBackdatedBeyondWindow('2026-08-21', '2026-09-21')).toBe(true);
  });

  test('the current month, today and the future are never blocked', () => {
    expect(isBackdatedBeyondWindow('2026-09-01', '2026-09-21')).toBe(false);
    expect(isBackdatedBeyondWindow('2026-09-21', '2026-09-21')).toBe(false);
    expect(isBackdatedBeyondWindow('2026-12-01', '2026-09-21')).toBe(false);
  });

  test('month lengths and year boundaries follow the calendar', () => {
    // Previous month has 28/29/30/31 days: 10 days back from the 1st.
    expect(earliestAllowedLeaveStart('2026-03-15')).toBe('2026-02-19'); // Feb 2026 has 28 days
    expect(earliestAllowedLeaveStart('2028-03-15')).toBe('2028-02-20'); // leap year
    expect(earliestAllowedLeaveStart('2026-05-15')).toBe('2026-04-21'); // April has 30 days
    expect(earliestAllowedLeaveStart('2027-01-05')).toBe('2026-12-22'); // across the year
  });

  test('no start date is not a backdating error', () => {
    expect(isBackdatedBeyondWindow(null, '2026-09-21')).toBe(false);
    expect(isBackdatedBeyondWindow(undefined, '2026-09-21')).toBe(false);
    expect(isBackdatedBeyondWindow('', '2026-09-21')).toBe(false);
  });

  test('a timestamped start date is judged by its date part', () => {
    expect(isBackdatedBeyondWindow('2026-08-22T00:00:00.000Z', '2026-09-21')).toBe(false);
    expect(isBackdatedBeyondWindow('2026-08-21T23:59:00', '2026-09-21')).toBe(true);
  });
});
