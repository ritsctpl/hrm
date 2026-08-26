import { test, expect } from '@playwright/test';
import { fmtMinutes, fmtPct, fromNowSafe } from '../../src/modules/hrmWorkforce/utils/workforceFormat';

test('fmtMinutes renders h:mm with zero-padded minutes', () => {
  expect(fmtMinutes(0)).toBe('0:00');
  expect(fmtMinutes(9)).toBe('0:09');
  expect(fmtMinutes(429)).toBe('7:09');   // Senthil's real present minutes
  expect(fmtMinutes(510)).toBe('8:30');
});
test('fmtMinutes tolerates null/negative as 0:00', () => {
  expect(fmtMinutes(null as unknown as number)).toBe('0:00');
  expect(fmtMinutes(-5)).toBe('0:00');
});
test('fmtPct renders integer percent, dash on null', () => {
  expect(fmtPct(41)).toBe('41%');
  expect(fmtPct(0)).toBe('0%');
  expect(fmtPct(null)).toBe('—');
});
test('fromNowSafe renders a relative time, dash on null or garbage', () => {
  expect(fromNowSafe(null)).toBe('—');
  expect(fromNowSafe('')).toBe('—');
  expect(fromNowSafe('not-a-date')).toBe('—');
  expect(fromNowSafe('2020-01-01T00:00:00Z')).toContain('ago');
});
