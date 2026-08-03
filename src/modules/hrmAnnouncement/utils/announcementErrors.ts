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

/**
 * A missing actor is a payload bug, not an access problem. Sending the user to
 * the access screen for it wastes their time chasing a grant that is already
 * there — surface it as an internal error and log the detail instead.
 */
export const ACTOR_REQUIRED = "HRM_ANN_ACTOR_REQUIRED";

/**
 * The server writes this one for the user, naming the exact fix (ask an
 * administrator to set your reporting manager). Anything we substitute would
 * say less, so it is shown verbatim.
 */
export const NO_APPROVER = "HRM_ANN_NO_APPROVER";

const MESSAGES: Record<string, string> = {
  [ACTOR_REQUIRED]: "Something went wrong sending this request. Please report this.",
  HRM_ANN_REASON_TOO_SHORT: "The reason must be at least 10 characters.",
  HRM_ANN_NOT_A_RECIPIENT: "This announcement was not sent to you.",
  PERMISSION_DENIED: "You do not have permission to do this.",
  // ── approval (single approver, resolved from the reporting hierarchy) ──
  HRM_ANN_AUTHOR_NOT_FOUND: "The author's employee record could not be found.",
  HRM_ANN_NOT_AN_APPROVER: "This announcement is not with you for approval.",
  HRM_ANN_SELF_APPROVAL_DISABLED: "You cannot approve your own announcement.",
  SELF_APPROVAL_NOT_ALLOWED: "You cannot approve your own announcement.",
  HRM_ANN_NOT_PENDING_APPROVAL: "This announcement is no longer awaiting approval.",
  HRM_ANN_APPROVAL_NOT_REQUIRED:
    "This announcement's category does not require approval — publish it directly.",
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
  "HRM_ANN_NOT_PENDING_APPROVAL",
]);

export interface AnnouncementErrorInfo {
  message: string;
  errorCode?: string;
  status?: number;
  /** true ⇒ reload the list before the user tries again. */
  shouldRefetch: boolean;
  /** true ⇒ a client-side payload bug, not a permissions problem. */
  isClientBug?: boolean;
}

export function parseAnnouncementError(
  err: unknown,
  fallback = "Something went wrong"
): AnnouncementErrorInfo {
  const e = err as AxiosLikeError;
  const status = e?.response?.status;
  const body = e?.response?.data;
  const errorCode = body?.errorCode;

  // HRM_ANN_NO_APPROVER is already written for the user and names the fix —
  // show the server text rather than a generic of our own.
  const message =
    (errorCode === NO_APPROVER ? body?.message : MESSAGES[errorCode ?? ""]) ??
    body?.message ??
    fallback;

  // Developer-facing: the payload was built wrong. Log loudly so it surfaces
  // in testing rather than being mistaken for a permissions problem.
  if (errorCode === ACTOR_REQUIRED) {
    console.error(
      "[announcement] HRM_ANN_ACTOR_REQUIRED — the request omitted its actor field. " +
        "Each endpoint reads the actor under a different name (createdBy / modifiedBy / " +
        "actorId / deletedBy / approverId / employeeCode). Server said:",
      body?.message
    );
  }

  return {
    message,
    errorCode,
    status,
    shouldRefetch: status === 409 || REFETCH_CODES.has(errorCode ?? ""),
    /** True when the cause is a client-side payload bug, not the user's rights. */
    isClientBug: errorCode === ACTOR_REQUIRED,
  };
}
