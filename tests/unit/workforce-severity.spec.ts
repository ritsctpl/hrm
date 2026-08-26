import { test, expect } from '@playwright/test';
import { healthSeverity } from '../../src/modules/hrmWorkforce/components/atoms/HealthMetric';

/**
 * The severity bands are the screen's copy of the backend detector's thresholds
 * (`HealthIssueDetector` on feat/workforce-collector: disk free < 10%, cpu p95 > 95%,
 * battery health < 50%). They are pinned here because a tile that colours itself on a
 * different number than the one that raises the issue would show a green disk next to an
 * open DISK_LOW ticket, and nothing in the build would object.
 *
 * `null → ok` is the deliberate half: an agent that could not read a sensor reports nothing,
 * and no evidence must never render as an alarm.
 */
test('disk free below 10% is critical, at/above is ok', () => {
  expect(healthSeverity('disk', 4)).toBe('crit');    // the demo laptop
  expect(healthSeverity('disk', 41)).toBe('ok');      // Senthil's laptop
});
test('cpu p95 over 95 critical; battery under 50 critical; null is ok', () => {
  expect(healthSeverity('cpu', 96)).toBe('crit');
  expect(healthSeverity('cpu', 23)).toBe('ok');
  expect(healthSeverity('battery', 40)).toBe('crit');
  expect(healthSeverity('battery', null)).toBe('ok');
});
