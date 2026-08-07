import { test, expect } from '@playwright/test';
import {
  useHrmTimesheetStore,
  drillDownSeedDate,
} from '../../src/modules/hrmTimesheet/stores/hrmTimesheetStore';
import {
  weekDates,
  shiftWeekStart,
  weekIntersectsMonth,
} from '../../src/modules/hrmTimesheet/utils/timesheetHelpers';

/**
 * CT-2026-473 (1): "In Time sheet app weekly view, only the past week is displayed.
 * Current week is not displaying. Monthly view shows current month."
 *
 * The manager drill-down (Employee Timesheets -> pick an employee -> Weekly) rendered
 * weekDates(selectedDate), and selectedDate was seeded from selectedMonth — the 1st of the
 * month — so the weekly grid always opened on the week containing the 1st.
 */

/** Local YYYY-MM-DD. Never toISOString(): it shifts the day in positive-offset zones. */
function ymd(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

test.describe('drill-down seed date', () => {
  // A fixed "now" so these assertions mean the same thing on every day of the year.
  const now = new Date('2026-08-07T09:00:00'); // Friday; the week runs Sun 02 -> Sat 08

  test('current month seeds today, not the 1st', () => {
    expect(drillDownSeedDate('month', '2026-08-01', '2026-08-03', now)).toBe('2026-08-07');
  });

  test('a historical month seeds its last day, so the review opens on that month\'s last week', () => {
    expect(drillDownSeedDate('month', '2026-03-01', '2026-08-03', now)).toBe('2026-03-31');
  });

  test('a future month seeds its first day (nothing later has happened yet)', () => {
    expect(drillDownSeedDate('month', '2026-11-01', '2026-08-03', now)).toBe('2026-11-01');
  });

  test('week period keeps the week the manager was already looking at', () => {
    expect(drillDownSeedDate('week', '2026-08-01', '2026-08-03', now)).toBe('2026-08-03');
  });

  test('February in a leap year resolves to the 29th', () => {
    expect(drillDownSeedDate('month', '2028-02-01', '2028-08-03', new Date('2028-08-07T09:00:00')))
      .toBe('2028-02-29');
  });
});

test.describe('openEmployeeReview (the real store action)', () => {
  test('lands the weekly grid on the week containing today', () => {
    const today = new Date();
    const monthStart = ymd(new Date(today.getFullYear(), today.getMonth(), 1));

    useHrmTimesheetStore.setState({
      managerPeriod: 'month',
      selectedMonth: monthStart,
      selectedDate: monthStart,
    });

    useHrmTimesheetStore.getState().openEmployeeReview({
      employeeId: 'EMP-TEST',
      employeeName: 'Test Employee',
      department: 'QA',
    });

    const state = useHrmTimesheetStore.getState();
    // The month the calendar shows must not move — only the day the week is derived from.
    expect(state.selectedMonth).toBe(monthStart);
    expect(weekDates(state.selectedDate)).toContain(ymd(today));
  });

  test('week period drill-in still aligns to the manager\'s selected week', () => {
    useHrmTimesheetStore.setState({
      managerPeriod: 'week',
      selectedWeekStart: '2026-08-03',
      selectedMonth: '2026-08-01',
    });

    useHrmTimesheetStore.getState().openEmployeeReview({
      employeeId: 'EMP-TEST',
      employeeName: 'Test Employee',
    });

    expect(useHrmTimesheetStore.getState().selectedDate).toBe('2026-08-03');
  });
});

test.describe('weekly navigation helpers', () => {
  test('steps a whole week at a time and lands on the Sunday', () => {
    expect(shiftWeekStart('2026-08-05', -1)).toBe('2026-07-26');
    expect(shiftWeekStart('2026-08-05', 0)).toBe('2026-08-02');
    expect(shiftWeekStart('2026-08-05', 1)).toBe('2026-08-09');
  });

  test('crosses a year boundary without drifting', () => {
    expect(shiftWeekStart('2026-01-01', -1)).toBe('2025-12-21');
  });

  test('a week is navigable while any of its days belong to the loaded month', () => {
    // Sun 26 Jul -> Sat 01 Aug still touches August.
    expect(weekIntersectsMonth('2026-07-26', '2026-08-01')).toBe(true);
    // Sun 30 Aug -> Sat 05 Sep still touches August.
    expect(weekIntersectsMonth('2026-08-30', '2026-08-01')).toBe(true);
    // Wholly July, and wholly September.
    expect(weekIntersectsMonth('2026-07-19', '2026-08-01')).toBe(false);
    expect(weekIntersectsMonth('2026-09-06', '2026-08-01')).toBe(false);
  });
});
