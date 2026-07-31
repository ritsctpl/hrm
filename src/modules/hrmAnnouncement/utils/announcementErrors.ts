/**
 * Announcement error handling (handover §7).
 *
 * Status codes are meaningful now — branch on them rather than parsing
 * messages. 403 and 404 bodies are deliberately shape-identical and disclose
 * nothing, so never infer existence from them.
 */

interface ApiErrorBody {
  errorCode?: string;
  message?: string;
  error?: string;
}

interface AxiosLikeError {
  response?: { status?: number; data?: ApiErrorBody };
}

const MESSAGES: Record<string, string> = {
  PERMISSION_DENIED: "You do not have permission to do this.",
  WRONG_APPROVAL_LEVEL: "This step needs a different approval permission.",
  NOT_AN_APPROVER: "You are not an approver for this announcement.",
  SELF_APPROVAL_NOT_ALLOWED: "You cannot approve your own announcement.",
  EMERGENCY_NOT_PERMITTED: "Emergency publishing is restricted.",
  HRM_ANN_NOT_FOUND: "Announcement not found.",
  ALREADY_ACTIONED: "Someone else has already actioned this.",
  INVALID_STATE_TRANSITION: "This announcement is no longer in a state that allows that.",
  CONCURRENT_MODIFICATION: "This was changed by someone else.",
  AUDIENCE_EMPTY: "This targeting matches nobody.",
  HRM_ANN_REASON_REQUIRED: "A reason is required.",
};

/** 409s mean the user's view is stale — refetch before letting them retry. */
const REFETCH_CODES = new Set([
  "ALREADY_ACTIONED",
  "INVALID_STATE_TRANSITION",
  "CONCURRENT_MODIFICATION",
]);

export interface AnnouncementErrorInfo {
  message: string;
  errorCode?: string;
  status?: number;
  /** true ⇒ reload the list before the user tries again. */
  shouldRefetch: boolean;
}

export function parseAnnouncementError(
  err: unknown,
  fallback = "Something went wrong"
): AnnouncementErrorInfo {
  const e = err as AxiosLikeError;
  const status = e?.response?.status;
  const body = e?.response?.data;
  const errorCode = body?.errorCode;

  // APPROVER_NOT_CONFIGURED names the missing grant — show the server text.
  const message =
    (errorCode === "APPROVER_NOT_CONFIGURED" ? body?.message : MESSAGES[errorCode ?? ""]) ??
    body?.message ??
    fallback;

  return {
    message,
    errorCode,
    status,
    shouldRefetch: status === 409 || REFETCH_CODES.has(errorCode ?? ""),
  };
}
