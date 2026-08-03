'use client';

import { useCan } from '@/modules/hrmAccess/hooks/useCan';

export const ANNOUNCEMENT_MODULE_CODE = 'HRM_ANNOUNCEMENT';

export interface AnnouncementPermissions {
  view: boolean;
  create: boolean;
  publishGeneral: boolean;
  emergency: boolean;
  /** ANNOUNCEMENT_MANAGE — the HR override, and what gates ratification. */
  manage: boolean;
  report: boolean;
}

/**
 * The six announcement grants.
 *
 * There is no approval grant: who approves is decided by the reporting
 * hierarchy, exactly as it is for leave, so a permission could never put
 * someone into a chain they are not in. Drive approval actions off
 * `/getPendingApprovals` — it returns only what the caller may act on — and
 * use `manage` for the HR override alone.
 *
 * Hiding a control is usability, not security (handover §0 rule 2): every
 * endpoint re-checks, so callers must still handle a 403.
 */
export function useAnnouncementPermissions(): AnnouncementPermissions {
  const record = useCan(ANNOUNCEMENT_MODULE_CODE, 'announcement_record');
  const publish = useCan(ANNOUNCEMENT_MODULE_CODE, 'announcement_publish');
  const emergency = useCan(ANNOUNCEMENT_MODULE_CODE, 'announcement_emergency');
  const module = useCan(ANNOUNCEMENT_MODULE_CODE, 'announcement_module');
  const report = useCan(ANNOUNCEMENT_MODULE_CODE, 'announcement_report');

  return {
    view: record.canView,
    create: record.canAdd,
    publishGeneral: publish.canAdd,
    emergency: emergency.canAdd,
    manage: module.canEdit,
    report: report.canView,
  };
}
