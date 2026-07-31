'use client';

import { useCan } from '@/modules/hrmAccess/hooks/useCan';

export const ANNOUNCEMENT_MODULE_CODE = 'HRM_ANNOUNCEMENT';

export interface AnnouncementPermissions {
  view: boolean;
  create: boolean;
  publishGeneral: boolean;
  approveL1: boolean;
  approveTop: boolean;
  emergency: boolean;
  manage: boolean;
  report: boolean;
}

/**
 * The eight announcement grants (frontend-handover.md §2).
 *
 * No permission implies another — in particular `manage` does NOT imply
 * `approveTop`, so an HRM admin cannot grant themselves final sign-off.
 *
 * Hiding a control is usability, not security (handover §0 rule 2): every
 * endpoint re-checks, so callers must still handle a 403.
 */
export function useAnnouncementPermissions(): AnnouncementPermissions {
  const record = useCan(ANNOUNCEMENT_MODULE_CODE, 'announcement_record');
  const publish = useCan(ANNOUNCEMENT_MODULE_CODE, 'announcement_publish');
  const approveL1 = useCan(ANNOUNCEMENT_MODULE_CODE, 'announcement_approve_l1');
  const approveTop = useCan(ANNOUNCEMENT_MODULE_CODE, 'announcement_approve_top');
  const emergency = useCan(ANNOUNCEMENT_MODULE_CODE, 'announcement_emergency');
  const module = useCan(ANNOUNCEMENT_MODULE_CODE, 'announcement_module');
  const report = useCan(ANNOUNCEMENT_MODULE_CODE, 'announcement_report');

  return {
    view: record.canView,
    create: record.canAdd,
    publishGeneral: publish.canAdd,
    approveL1: approveL1.canEdit,
    approveTop: approveTop.canEdit,
    emergency: emergency.canAdd,
    manage: module.canEdit,
    report: report.canView,
  };
}
