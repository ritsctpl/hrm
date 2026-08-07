// src/modules/hrmTimesheet/utils/backendMessage.ts

/**
 * Pulls the message hrm-service actually sent out of an axios error.
 *
 * The timesheet endpoints answer in two shapes, and both carry text the user needs:
 *   - `TimesheetExceptionHandler` (403 / 404 / 409 / 422) →
 *       `{ timestamp, error, errorCode, message }`
 *   - the controllers' own `catch (HrmException)` (400) →
 *       `MessageModel { errorCode, response }`
 *
 * Order matters: the most specific field wins, and `errorCode` is the last resort so a
 * bare code is still better than a generic sentence. Never returns undefined — a caller
 * that has nothing to show gets its own fallback back.
 */
export function extractBackendMsg(error: any, fallback: string): string {
  return (
    error?.response?.data?.message_details?.msg ||
    error?.response?.data?.message ||
    error?.response?.data?.response ||
    error?.response?.data?.error ||
    error?.response?.data?.errorCode ||
    error?.message ||
    fallback
  );
}
