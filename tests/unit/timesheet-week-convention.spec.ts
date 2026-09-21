import { test, expect } from '@playwright/test';
import {
  mondayOf,
  weekDates,
  buildMonthMatrix,
  weekOfMonthIndex,
  isWeekendDate,
  pendingSubmissionWeeks,
  WEEKDAY_LABELS,
  monthGridRange,
  isInMonth,
} from '../../src/modules/hrmTimesheet/utils/timesheetHelpers';

/**
 * HRM issue #2: timesheet weeks must run Monday -> Sunday (the team was logging hours on
 * Sunday by mistake because the week opened on Sunday).
 *
 * HRM issue #6: the "Week-N of <Month> has not been submitted" banner grouped days into
 * Sun -> Sat weeks. The reporter's Week 2 was Mon 03 - Sun 09 Aug 2026; the FE's "Week 2"
 * was Sun 02 - Sat 08 Aug, so a leftover REJECTED Sun 02 Aug kept "Week-2" flagged, and
 * Sun 09 Aug was counted as Week 3.
 */

test.describe('Mon -> Sun weeks', () => {
  test('every day of 03-09 Aug 2026 belongs to the week of Mon 03 Aug', () => {
    for (const d of ['2026-08-03', '2026-08-05', '2026-08-08', '2026-08-09']) {
      expect(mondayOf(d)).toBe('2026-08-03');
    }
  });

  test('Sun 09 Aug is the last day of its week, Sun 02 Aug the last day of the previous one', () => {
    expect(mondayOf('2026-08-09')).toBe('2026-08-03');
    expect(mondayOf('2026-08-02')).toBe('2026-07-27');
    expect(mondayOf('2026-08-10')).toBe('2026-08-10');
  });

  test('weekDates runs Monday first, Sunday last', () => {
    expect(weekDates('2026-08-09')).toEqual([
      '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09',
    ]);
  });

  test('header labels match', () => {
    expect([...WEEKDAY_LABELS]).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  test('crosses month and year boundaries', () => {
    expect(mondayOf('2026-03-01')).toBe('2026-02-23'); // Sunday
    expect(mondayOf('2027-01-03')).toBe('2026-12-28'); // Sunday
    expect(mondayOf('2028-02-29')).toBe('2028-02-28'); // leap day, a Tuesday
  });

  test('an ISO timestamp is read by its date part', () => {
    expect(mondayOf('2026-08-09T23:30:00')).toBe('2026-08-03');
  });

  test('weekend is still Saturday and Sunday', () => {
    expect(isWeekendDate('2026-08-08')).toBe(true);
    expect(isWeekendDate('2026-08-09')).toBe(true);
    expect(isWeekendDate('2026-08-03')).toBe(false);
    expect(isWeekendDate('2026-08-07')).toBe(false);
  });
});

test.describe('month grid', () => {
  test('August 2026 (1st is a Saturday) starts on Mon 27 Jul and ends on Sun 06 Sep', () => {
    const weeks = buildMonthMatrix('2026-08-01');
    expect(weeks).toHaveLength(6);
    expect(weeks[0][0]).toEqual({ date: '2026-07-27', inMonth: false });
    expect(weeks[0][5]).toEqual({ date: '2026-08-01', inMonth: true });
    expect(weeks[0][6]).toEqual({ date: '2026-08-02', inMonth: true });
    expect(weeks[1].map((c) => c.date)).toEqual(weekDates('2026-08-03'));
    expect(weeks[5][0]).toEqual({ date: '2026-08-31', inMonth: true });
    expect(weeks[5][6]).toEqual({ date: '2026-09-06', inMonth: false });
  });

  test('every row starts on a Monday', () => {
    for (const m of ['2026-02-01', '2026-06-01', '2026-08-01', '2026-11-01']) {
      buildMonthMatrix(m).forEach((row) => expect(mondayOf(row[0].date)).toBe(row[0].date));
    }
  });

  test('a month starting on Monday has no leading cells (June 2026)', () => {
    const weeks = buildMonthMatrix('2026-06-01');
    expect(weeks[0][0]).toEqual({ date: '2026-06-01', inMonth: true });
    expect(weeks[weeks.length - 1][6]).toEqual({ date: '2026-07-05', inMonth: false });
  });

  test('covers every day of the month exactly once', () => {
    const inMonth = buildMonthMatrix('2026-08-01').flat().filter((c) => c.inMonth).map((c) => c.date);
    expect(inMonth).toHaveLength(31);
    expect(new Set(inMonth).size).toBe(31);
  });
});

test.describe('week-of-month index', () => {
  test('the reporter\'s Week 2 is Mon 03 - Sun 09 Aug 2026', () => {
    for (const d of ['2026-08-03', '2026-08-06', '2026-08-09']) expect(weekOfMonthIndex(d)).toBe(2);
  });

  test('Sat 01 and Sun 02 Aug are Week 1; Mon 10 Aug is Week 3', () => {
    expect(weekOfMonthIndex('2026-08-01')).toBe(1);
    expect(weekOfMonthIndex('2026-08-02')).toBe(1);
    expect(weekOfMonthIndex('2026-08-10')).toBe(3);
    expect(weekOfMonthIndex('2026-08-31')).toBe(6);
  });

  test('a straddling week is numbered against the month being displayed', () => {
    // Mon 27 Jul is the first row of the August grid.
    expect(weekOfMonthIndex('2026-07-27', '2026-08-01')).toBe(1);
    // …and the last row of July's.
    expect(weekOfMonthIndex('2026-07-27')).toBe(5);
    expect(weekOfMonthIndex('2026-07-27', '2026-07-01')).toBe(5);
  });
});

test.describe('pending-submission banner weeks', () => {
  const today = '2026-08-25';

  test('the live repro: a rejected Sun 02 Aug no longer flags the Mon 03 - Sun 09 week', () => {
    const days = [
      { date: '2026-08-02', status: 'REJECTED', totalHours: 11 },
      ...['03', '04', '05', '06', '07'].map((d) => ({ date: `2026-08-${d}`, status: 'APPROVED', totalHours: 9 })),
      { date: '2026-08-09', status: 'APPROVED', totalHours: 4 },
    ];
    expect(pendingSubmissionWeeks(days, '2026-08-01', today)).toEqual([
      { week: 1, start: '2026-07-27', end: '2026-08-02', days: ['2026-08-02'] },
    ]);
  });

  test('an approved/submitted Mon-Sun week raises nothing', () => {
    const days = ['03', '04', '05', '06', '07', '08', '09'].map((d, i) => ({
      date: `2026-08-${d}`,
      status: i % 2 ? 'SUBMITTED' : 'APPROVED',
      totalHours: 8,
    }));
    expect(pendingSubmissionWeeks(days, '2026-08-01', today)).toEqual([]);
  });

  test('Sun 09 Aug pending is reported as Week 2, naming the day', () => {
    const days = [
      { date: '2026-08-03', status: 'APPROVED', totalHours: 8 },
      { date: '2026-08-09', status: 'DRAFT', totalHours: 2 },
    ];
    expect(pendingSubmissionWeeks(days, '2026-08-01', today)).toEqual([
      { week: 2, start: '2026-08-03', end: '2026-08-09', days: ['2026-08-09'] },
    ]);
  });

  test('zero-hour, future and other-month days are ignored', () => {
    const days = [
      { date: '2026-08-11', status: 'DRAFT', totalHours: 0 },
      { date: '2026-08-26', status: 'DRAFT', totalHours: 8 }, // after "today"
      { date: '2026-07-31', status: 'DRAFT', totalHours: 8 }, // July
      { date: '2026-08-12', status: 'REOPENED', totalHours: 3 },
      { date: '2026-08-13', status: 'REJECTED', totalHours: 3 },
    ];
    expect(pendingSubmissionWeeks(days, '2026-08-01', today)).toEqual([
      { week: 3, start: '2026-08-10', end: '2026-08-16', days: ['2026-08-12', '2026-08-13'] },
    ]);
  });

  test('several weeks come back in order', () => {
    const days = [
      { date: '2026-08-19', status: 'DRAFT', totalHours: 8 },
      { date: '2026-08-04', status: 'DRAFT', totalHours: 8 },
    ];
    expect(pendingSubmissionWeeks(days, '2026-08-01', today).map((w) => w.week)).toEqual([2, 4]);
  });
});

test.describe('month grid load range (cross-month weeks show real data)', () => {
  test('August 2026 loads Mon 27 Jul through Sun 06 Sep', () => {
    expect(monthGridRange('2026-08-01')).toEqual({ start: '2026-07-27', end: '2026-09-06' });
  });

  test('the range is exactly the grid\'s first and last cell, for every month of two years', () => {
    for (const y of [2026, 2028]) {
      for (let m = 1; m <= 12; m++) {
        const monthStart = `${y}-${String(m).padStart(2, '0')}-01`;
        const grid = buildMonthMatrix(monthStart);
        expect(monthGridRange(monthStart)).toEqual({
          start: grid[0][0].date,
          end: grid[grid.length - 1][6].date,
        });
      }
    }
  });

  test('a cross-month week is fully inside the range', () => {
    const { start, end } = monthGridRange('2026-08-01');
    for (const d of weekDates('2026-07-27')) {
      expect(d >= start && d <= end).toBe(true);
    }
  });

  test('a month that starts on Monday has no leading days; Feb 2027 (Mon 1 – Sun 28) is exact', () => {
    // March 2027: Mon 01 Mar … Wed 31 Mar → ends Sun 04 Apr.
    expect(monthGridRange('2027-03-01')).toEqual({ start: '2027-03-01', end: '2027-04-04' });
    // February 2027: Mon 01 Feb … Sun 28 Feb — exactly the month.
    expect(monthGridRange('2027-02-01')).toEqual({ start: '2027-02-01', end: '2027-02-28' });
  });

  test('isInMonth separates the displayed month from the neighbouring cells', () => {
    expect(isInMonth('2026-08-02', '2026-08-01')).toBe(true);
    expect(isInMonth('2026-07-27', '2026-08-01')).toBe(false);
    expect(isInMonth('2026-09-06', '2026-08-01')).toBe(false);
  });
});
