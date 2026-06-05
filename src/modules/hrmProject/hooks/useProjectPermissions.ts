'use client';

import { useMemo } from 'react';
import { useCan } from '../../hrmAccess/hooks/useCan';

/**
 * RBAC-based permissions for the Project & Resource Allocation module.
 * Resolves granular object-level permissions so the landing tabs only
 * render when the user's grants include `view` on the matching object.
 *
 * Object codes (see moduleObjectRegistry → HRM_PROJECT):
 * - project_module     : Module Access (root)
 * - project_record     : Projects
 * - project_allocation : Resource Allocation
 * - project_approval   : Allocation Approvals
 * - project_calendar   : Calendar
 * - project_report     : Reports
 */
export interface ProjectPermissions {
  canViewModule: boolean;

  // Tab visibility — a tab is shown when the user has ANY allowed action
  // (View / Add / Edit / Delete) on the object. RBAC configs commonly grant
  // Add/Delete without an explicit View, and an admin with module-level
  // access still needs the tab to render. Gating strictly on `canView`
  // would wrongly hide tabs for those roles.
  canAccessProjects: boolean;
  canAccessApprovals: boolean;
  canAccessCalendar: boolean;
  canAccessReports: boolean;

  // Granular action flags for buttons inside the tabs.
  canViewProjects: boolean;
  canAddProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;

  canViewApprovals: boolean;
  canApproveAllocation: boolean;

  canViewCalendar: boolean;
  canViewReports: boolean;
}

/** True when the role has any of View / Add / Edit / Delete on the object. */
const anyAction = (p: { canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }) =>
  p.canView || p.canAdd || p.canEdit || p.canDelete;

export function useProjectPermissions(): ProjectPermissions {
  const modulePerms = useCan('HRM_PROJECT', 'project_module');
  const recordPerms = useCan('HRM_PROJECT', 'project_record');
  const approvalPerms = useCan('HRM_PROJECT', 'project_approval');
  const calendarPerms = useCan('HRM_PROJECT', 'project_calendar');
  const reportPerms = useCan('HRM_PROJECT', 'project_report');

  return useMemo(
    () => ({
      canViewModule: modulePerms.canView,

      canAccessProjects: anyAction(recordPerms),
      canAccessApprovals: anyAction(approvalPerms),
      canAccessCalendar: anyAction(calendarPerms),
      canAccessReports: anyAction(reportPerms),

      canViewProjects: recordPerms.canView,
      canAddProject: recordPerms.canAdd,
      canEditProject: recordPerms.canEdit,
      canDeleteProject: recordPerms.canDelete,

      canViewApprovals: approvalPerms.canView,
      canApproveAllocation: approvalPerms.canEdit,

      canViewCalendar: calendarPerms.canView,
      canViewReports: reportPerms.canView,
    }),
    [modulePerms, recordPerms, approvalPerms, calendarPerms, reportPerms],
  );
}
