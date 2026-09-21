import { test, expect } from '@playwright/test';
import { matchesHolidayStatsFilter } from '../../src/modules/hrmHoliday/utils/calendarHelpers';

/**
 * HRM issue #8: the Total / Upcoming / Done buttons only changed the List tab. The Year tab
 * now dims holidays outside the selection, using this same predicate the List tab filters
 * with — so both tabs agree on which holidays are "upcoming" and which are "done".
 */
test.describe('holiday Total / Upcoming / Done filter', () => {
  const today = '2026-09-21';

  test('Total keeps every holiday', () => {
    expect(matchesHolidayStatsFilter('2026-01-26', 'all', today)).toBe(true);
    expect(matchesHolidayStatsFilter('2026-12-25', 'all', today)).toBe(true);
  });

  test('Upcoming is today onward', () => {
    expect(matchesHolidayStatsFilter('2026-09-21', 'upcoming', today)).toBe(true);
    expect(matchesHolidayStatsFilter('2026-12-25', 'upcoming', today)).toBe(true);
    expect(matchesHolidayStatsFilter('2026-09-20', 'upcoming', today)).toBe(false);
  });

  test('Done is strictly before today', () => {
    expect(matchesHolidayStatsFilter('2026-09-20', 'completed', today)).toBe(true);
    expect(matchesHolidayStatsFilter('2026-09-21', 'completed', today)).toBe(false);
    expect(matchesHolidayStatsFilter('2026-10-02', 'completed', today)).toBe(false);
  });

  test('a timestamped date is judged by its date part only', () => {
    expect(matchesHolidayStatsFilter('2026-09-21T00:00:00.000Z', 'upcoming', today)).toBe(true);
    expect(matchesHolidayStatsFilter('2026-09-21T00:00:00.000Z', 'completed', today)).toBe(false);
  });

  test('every holiday is exactly one of Upcoming or Done', () => {
    for (const d of ['2026-01-01', '2026-09-20', '2026-09-21', '2026-12-31']) {
      const up = matchesHolidayStatsFilter(d, 'upcoming', today);
      const done = matchesHolidayStatsFilter(d, 'completed', today);
      expect(up !== done).toBe(true);
    }
  });
});
