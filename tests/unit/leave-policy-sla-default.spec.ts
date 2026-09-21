import { test, expect } from '@playwright/test';
import {
  DEFAULT_SUPERVISOR_SLA_DAYS,
  DEFAULT_ESCALATION_SLA_DAYS,
} from '../../src/modules/hrmLeave/utils/constants';

/**
 * HRM issue #9: "Leave approval SLA should be increased to 7 days."
 *
 * A new leave policy (Leave -> Policy Settings -> add policy) is seeded with these values,
 * and a save with the field left empty falls back to them.
 */
test.describe('leave policy SLA defaults', () => {
  test('a new policy gives the supervisor 7 days', () => {
    expect(DEFAULT_SUPERVISOR_SLA_DAYS).toBe(7);
  });

  test('the escalation SLA default is unchanged', () => {
    expect(DEFAULT_ESCALATION_SLA_DAYS).toBe(1);
  });
});
