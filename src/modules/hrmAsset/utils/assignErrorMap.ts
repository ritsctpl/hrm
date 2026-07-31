/**
 * HRM Asset Module — direct assignment error mapping.
 *
 * The backend returns an `{ errorCode, message }` body (`AssetExceptionHandler`)
 * with the status varying by exception type: 403 for AssetAccessDeniedException,
 * 409 for AssetConflictException, 400 for everything else.
 *
 * Mapping is on `errorCode`, never on the status: the design document's
 * 422-plus-descriptive-name scheme (ASSET_NOT_AVAILABLE and friends) is not
 * what this service returns. Status is consulted only for the three cases that
 * carry no code — no response at all, 401, and 5xx.
 *
 * Codes the design expects but the service does not raise: CATEGORY_LIMIT_EXCEEDED,
 * WARNINGS_NOT_ACKNOWLEDGED, IDEMPOTENCY_KEY_REUSED — see
 * hrm-design/asset-direct-assignment/frontend-status.md §2.
 */

export interface AssignErrorInfo {
  /** Safe to render verbatim. Always names the asset and employee. */
  message: string;
  /** Attach the message to this form field when the user can fix it in place. */
  field?: 'assetId' | 'employeeId' | 'assignmentReason' | 'remarks';
  /** The asset moved under us — re-read it and keep the modal open. */
  refreshAsset?: boolean;
  /**
   * We could not confirm whether the write landed. The message must not imply
   * either success or failure.
   */
  indeterminate?: boolean;
  /**
   * The backend refused the action outright. The modal closes, the permission
   * cache is dropped and refetched, and the control disappears — a 403 here
   * means the UI and the service disagreed about what this user may do.
   */
  denied?: boolean;
}

interface AssignErrorContext {
  assetId?: string;
  employeeId?: string;
}

function suffix(ctx: AssignErrorContext): string {
  const parts = [ctx.assetId, ctx.employeeId].filter(Boolean);
  return parts.length ? ` (${parts.join(' → ')})` : '';
}

export function mapAssignError(err: any, ctx: AssignErrorContext = {}): AssignErrorInfo {
  const status = err?.response?.status;
  const data = err?.response?.data ?? {};
  const code: string | undefined = data.errorCode;
  const backendMessage: string | undefined = data.message;

  // No response at all: request never completed, or the reply was lost. The
  // assignment may or may not have been written — say exactly that.
  if (!err?.response) {
    return {
      message:
        `We could not confirm whether the assignment${suffix(ctx)} completed. ` +
        'Refresh the asset before retrying.',
      indeterminate: true,
    };
  }

  if (status === 401) {
    return { message: 'Your session has expired. Sign in again to continue.' };
  }

  // Deliberately uniform on the service side — the body reveals nothing about
  // whether the asset or employee exists, so there is nothing more to say than
  // the message itself.
  if (status === 403 || code === 'PERMISSION_DENIED') {
    return {
      message:
        backendMessage ||
        'You do not have permission to assign assets directly. Contact your HRM administrator.',
      denied: true,
    };
  }

  if (status >= 500) {
    return {
      message:
        `Something went wrong and the assignment${suffix(ctx)} may not have completed. ` +
        'Refresh the asset before retrying.',
      indeterminate: true,
    };
  }

  switch (code) {
    case 'ASSET_002': // "Asset is not In Store. Current status: X"
      return {
        message: backendMessage
          ? `${backendMessage} It cannot be assigned${suffix(ctx)}.`
          : `This asset is no longer in store and cannot be assigned${suffix(ctx)}.`,
        refreshAsset: true,
      };

    // 409. The service message already names the current holder, so it is more
    // useful than anything reconstructable here.
    case 'ASSET_004':
      return {
        message: backendMessage
          ? `${backendMessage} Refresh and pick another asset.`
          : `This asset already has an open custody record${suffix(ctx)}.`,
        refreshAsset: true,
      };

    // 409. Lost the compare-and-set race: the asset left IN_STORE between
    // validation and the write.
    case 'ASSET_009':
      return {
        message: backendMessage || `This asset was assigned by someone else moments ago${suffix(ctx)}.`,
        refreshAsset: true,
      };

    // Employment status bars the hand-over. Fixable only by picking a
    // different employee, so it belongs on that field.
    case 'ASSET_010':
      return {
        message: backendMessage || `This employee cannot be assigned assets${suffix(ctx)}.`,
        field: 'employeeId',
      };

    case 'ASSET_003': // employee missing from the payload
      return {
        message: 'Select an employee to assign this asset to.',
        field: 'employeeId',
      };

    case 'ASSET_006': // employee not found for the organization
      return {
        message: backendMessage || `Employee not found${suffix(ctx)}.`,
        field: 'employeeId',
      };

    // The reason was not one of the seven the service accepts. The form only
    // offers those seven, so reaching this means the two lists have drifted —
    // show it on the field, but it is a bug, not user error.
    case 'ASSET_011':
      return {
        message: backendMessage || 'That assignment reason is not recognised.',
        field: 'assignmentReason',
      };

    // OTHER without enough explanation. R-10 catches this first; a hit here
    // means the client and server minimums disagree.
    case 'ASSET_012':
      return {
        message: backendMessage || 'Describe the reason in more detail.',
        field: 'remarks',
      };

    case 'ASSET_404':
      return {
        message: `This asset no longer exists${suffix(ctx)}.`,
        field: 'assetId',
        refreshAsset: true,
      };

    default:
      return {
        message: backendMessage
          ? `${backendMessage}${suffix(ctx)}`
          : `Failed to assign asset${suffix(ctx)}.`,
      };
  }
}
