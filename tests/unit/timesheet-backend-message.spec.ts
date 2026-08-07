import { test, expect } from '@playwright/test';
import { extractBackendMsg } from '../../src/modules/hrmTimesheet/utils/backendMessage';

/**
 * CT-2026-473 (2): approving a single day showed "Failed to process approval" and nothing
 * else, because the approval handler hard-coded that string instead of reading the reason
 * the server had already sent.
 *
 * The bodies below are the two shapes hrm-service actually returns on the timesheet
 * approval path:
 *   - TimesheetExceptionHandler (403/409/404) -> { timestamp, error, errorCode, message }
 *   - TimesheetController's own catch (400)   -> MessageModel { errorCode, response }
 * Both must reach the user verbatim.
 */

const FALLBACK = 'Failed to process approval';

test('403 APPROVAL_NOT_PERMITTED names the responsible approver', () => {
  const err = {
    response: {
      status: 403,
      data: {
        timestamp: '2026-08-07T10:15:30.123',
        error: 'Approval Not Permitted',
        errorCode: 'APPROVAL_NOT_PERMITTED',
        message: 'Approval for this timesheet belongs to Priya R.',
        approvalOwnerId: 'EMP-0042',
        approvalOwnerName: 'Priya R',
      },
    },
  };
  expect(extractBackendMsg(err, FALLBACK)).toBe('Approval for this timesheet belongs to Priya R.');
});

test('403 PERMISSION_DENIED tells the user it is a permission, not a fault', () => {
  const err = {
    response: {
      status: 403,
      data: {
        error: 'Permission Denied',
        errorCode: 'PERMISSION_DENIED',
        message: 'You do not have permission to view team timesheets.',
      },
    },
  };
  expect(extractBackendMsg(err, FALLBACK)).toBe('You do not have permission to view team timesheets.');
});

test('400 MessageModel (errorCode + response) surfaces the status conflict', () => {
  const err = {
    response: {
      status: 400,
      data: {
        errorCode: 'TS_006',
        response: 'Only SUBMITTED timesheets can be approved/rejected. Current: APPROVED',
      },
    },
  };
  expect(extractBackendMsg(err, FALLBACK)).toBe(
    'Only SUBMITTED timesheets can be approved/rejected. Current: APPROVED'
  );
});

test('400 TS_016 explains the missing skip-level remark', () => {
  const err = {
    response: {
      status: 400,
      data: {
        errorCode: 'TS_016',
        response: 'Remarks are mandatory when approving outside your direct reporting line',
      },
    },
  };
  expect(extractBackendMsg(err, FALLBACK)).toBe(
    'Remarks are mandatory when approving outside your direct reporting line'
  );
});

test('MessageModel message_details wins when present', () => {
  const err = { response: { data: { message_details: { msg: 'Approved successfully' } } } };
  expect(extractBackendMsg(err, FALLBACK)).toBe('Approved successfully');
});

test('a transport failure with no body still says something, never undefined', () => {
  expect(extractBackendMsg({ message: 'Network Error' }, FALLBACK)).toBe('Network Error');
  expect(extractBackendMsg({}, FALLBACK)).toBe(FALLBACK);
  expect(extractBackendMsg(null, FALLBACK)).toBe(FALLBACK);
});
