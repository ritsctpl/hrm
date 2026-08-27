import { test, expect } from '@playwright/test';
import { parseFingerprintList } from '../../src/modules/hrmWorkforce/hooks/useHrmWorkforceData';
test('splits on comma and newline; trims; drops blanks; dedups', () => {
  expect(parseFingerprintList('A4:BB:6D:11:22:33, C8:3A:35:00:11:22')).toEqual(['A4:BB:6D:11:22:33','C8:3A:35:00:11:22']);
  expect(parseFingerprintList(' one \n two \n\n one ')).toEqual(['one','two']);
  expect(parseFingerprintList('')).toEqual([]);
  expect(parseFingerprintList('   ')).toEqual([]);
});
