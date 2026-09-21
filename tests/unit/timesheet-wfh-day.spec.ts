import { test, expect } from '@playwright/test';
import {
  isBlockingLeaveDay,
  isWfhDay,
  isWorkingLeaveType,
} from '../../src/modules/hrmTimesheet/utils/timesheetHelpers';

/**
 * HRM issue #4: "On work-from-home days we should be able to fill the timesheet, but we
 * couldn't." WFH is stored as an auto-approved leave request with leave type "WFH", so the
 * timesheet API reports the day as leaveDay=true / leaveType="WFH", and every view that
 * checked `leaveDay` locked it like CL/SL. Those views now ask isBlockingLeaveDay().
 */
test.describe('WFH is a working day', () => {
  test('a full-day WFH record does not lock time entry', () => {
    expect(isBlockingLeaveDay({ leaveDay: true, leaveType: 'WFH' })).toBe(false);
  });

  test('…and is shown as WFH', () => {
    expect(isWfhDay({ leaveDay: true, leaveType: 'WFH' })).toBe(true);
    // Still recognised if the backend stops flagging it as a leave day.
    expect(isWfhDay({ leaveDay: false, leaveType: 'WFH' })).toBe(true);
  });

  test('the code match tolerates case and whitespace', () => {
    expect(isWorkingLeaveType('wfh')).toBe(true);
    expect(isWorkingLeaveType(' WFH ')).toBe(true);
  });

  test('real leave still locks the day', () => {
    for (const code of ['CL', 'SL', 'EARNED_LEAVE', 'CO']) {
      expect(isBlockingLeaveDay({ leaveDay: true, leaveType: code })).toBe(true);
      expect(isWfhDay({ leaveDay: true, leaveType: code })).toBe(false);
    }
  });

  test('a leave day with no type reported stays locked (safe default)', () => {
    expect(isBlockingLeaveDay({ leaveDay: true })).toBe(true);
    expect(isBlockingLeaveDay({ leaveDay: true, leaveType: null })).toBe(true);
  });

  test('an ordinary day or a missing record is neither', () => {
    expect(isBlockingLeaveDay({ leaveDay: false })).toBe(false);
    expect(isBlockingLeaveDay(undefined)).toBe(false);
    expect(isWfhDay(null)).toBe(false);
  });
});

test.describe('WFH code match follows the backend (prefix "WFH")', () => {
  test('any WFH-prefixed code is a working day', () => {
    for (const code of ['WFH', 'WFH_FULL', 'wfh-half', 'WFHX']) {
      expect(isWorkingLeaveType(code)).toBe(true);
      expect(isBlockingLeaveDay({ leaveDay: true, leaveType: code })).toBe(false);
    }
  });

  test('a code that merely contains WFH elsewhere is not', () => {
    expect(isWorkingLeaveType('NO_WFH')).toBe(false);
    expect(isWorkingLeaveType('')).toBe(false);
  });

  test('the new backend shape (leaveDay=false, leaveType WFH*) is labelled WFH and is open', () => {
    const day = { leaveDay: false, leaveType: 'WFH_FULL' };
    expect(isWfhDay(day)).toBe(true);
    expect(isBlockingLeaveDay(day)).toBe(false);
  });

  test('the old backend shape (leaveDay=true, leaveType WFH) is labelled WFH and is open', () => {
    const day = { leaveDay: true, leaveType: 'WFH' };
    expect(isWfhDay(day)).toBe(true);
    expect(isBlockingLeaveDay(day)).toBe(false);
  });
});
