/**
 * Extract a user-facing error message from an axios error returned by the
 * HRM Expense backend.
 *
 * The backend returns errors in this shape (see /expense/submit failures):
 * {
 *   "site": null,
 *   "handle": null,
 *   "message_details": {
 *     "msg_type": "E",
 *     "msg": "Receipt attachment required for category: MEALS"
 *   },
 *   "errorCode": "EXPENSE_ATTACHMENT_REQUIRED",
 *   "response": null
 * }
 *
 * Resolution order:
 *   1. response.data.message_details.msg  — primary HRM-style message
 *   2. response.data.message               — generic backend message
 *   3. response.data.error                 — alternate field
 *   4. error.message                       — axios/fetch network error
 *   5. fallback                            — caller-provided default
 */
export function extractExpenseError(error: unknown, fallback: string): string {
  const err = error as {
    response?: {
      data?: {
        message_details?: { msg?: string; msg_type?: string };
        message?: string;
        error?: string;
        errorCode?: string;
      };
    };
    message?: string;
  };

  const backendMsg =
    err?.response?.data?.message_details?.msg ||
    err?.response?.data?.message ||
    err?.response?.data?.error;

  return backendMsg || err?.message || fallback;
}
