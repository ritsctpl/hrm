import { test, expect } from '@playwright/test';
import { serverErrorMessage, parseAnnouncementError } from '../../src/modules/hrmAnnouncement/utils/announcementErrors';

/**
 * HRM issue #11: saving an announcement with a title under 3 characters failed server-side
 * ("title: size must be between 3 and 200"), and nothing was shown on screen.
 *
 * Root cause: every save path in AnnouncementComposeDrawer (`reportSaveError`) showed a
 * hard-coded fallback string no matter what the error was — it never looked at the caught
 * value at all, except to special-case the empty-audience sentinel. `submitForApproval` did
 * look, via `parseAnnouncementError`, but read `body?.message` — a field the announcement error
 * envelope doesn't carry; the real text sits at `body.message_details.msg`. Both are fixed here
 * through the one shared extractor, `serverErrorMessage`.
 *
 * The exact body below is what hrm-service actually returns for `AnnouncementRequest.title`'s
 * `@Size(min = 3, max = 200)`, pasted from the ticket.
 */

const FALLBACK = 'Failed to save announcement';

const VALIDATION_BODY = {
  site: null,
  handle: null,
  message_details: { msg_type: 'E', msg: 'title: size must be between 3 and 200' },
  errorCode: 'HRM_VALIDATION',
  response: null,
};

test('the exact HRM_VALIDATION payload — message_details.msg reaches the user', () => {
  // Shaped exactly as api.ts's response interceptor produces it: a real Error whose own
  // .message it already set, plus .response and .errorCode carried along for good measure.
  const err = Object.assign(new Error(VALIDATION_BODY.message_details.msg), {
    response: { status: 400, data: VALIDATION_BODY },
    errorCode: VALIDATION_BODY.errorCode,
  });
  expect(serverErrorMessage(err, FALLBACK)).toBe('title: size must be between 3 and 200');
});

test('the same payload works even if something threw it before the interceptor set .message', () => {
  // Same body, but as a raw axios-style rejection whose own .message is the generic axios
  // wording — the extractor must still prefer the body's message_details.msg.
  const err = {
    message: 'Request failed with status code 400',
    response: { status: 400, data: VALIDATION_BODY },
  };
  expect(serverErrorMessage(err, FALLBACK)).toBe('title: size must be between 3 and 200');
});

test('plain Error — its own message is shown, there is nothing else to show', () => {
  expect(serverErrorMessage(new Error('Network Error'), FALLBACK)).toBe('Network Error');
});

test('axios-error with no structured body falls back to fallback, not undefined or "undefined"', () => {
  const err = { response: { status: 500, data: {} } };
  expect(serverErrorMessage(err, FALLBACK)).toBe(FALLBACK);
});

test('axios-error using the flatter { success, message } shape', () => {
  const err = {
    response: { status: 400, data: { success: false, message: 'Priority must be one of GENERAL, IMPORTANT, CRITICAL, EMERGENCY', messageCode: 'HRM_VALIDATION' } },
  };
  expect(serverErrorMessage(err, FALLBACK)).toBe(
    'Priority must be one of GENERAL, IMPORTANT, CRITICAL, EMERGENCY'
  );
});

test('unknown / non-Error thrown values fall back, never throw or return undefined', () => {
  expect(serverErrorMessage('just a string', FALLBACK)).toBe(FALLBACK);
  expect(serverErrorMessage(undefined, FALLBACK)).toBe(FALLBACK);
  expect(serverErrorMessage(null, FALLBACK)).toBe(FALLBACK);
  expect(serverErrorMessage({ foo: 1 }, FALLBACK)).toBe(FALLBACK);
});

test('parseAnnouncementError also surfaces message_details.msg — used by submitForApproval et al.', () => {
  const err = Object.assign(new Error(VALIDATION_BODY.message_details.msg), {
    response: { status: 400, data: VALIDATION_BODY },
    errorCode: VALIDATION_BODY.errorCode,
  });
  const info = parseAnnouncementError(err, FALLBACK);
  expect(info.message).toBe('title: size must be between 3 and 200');
  expect(info.errorCode).toBe('HRM_VALIDATION');
});

test('parseAnnouncementError still prefers its known-errorCode MESSAGES override', () => {
  const err = {
    response: { status: 409, data: { errorCode: 'ALREADY_ACTIONED', message_details: { msg: 'raw server text' } } },
  };
  expect(parseAnnouncementError(err, FALLBACK).message).toBe('Someone else has already actioned this.');
});
