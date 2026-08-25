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
 * - project_calendar   : Calendar
 * - project_report     : Reports
 *
 * These gate tab *visibility* only. Create/edit on an individual project,
 * its tasks, allocations, or milestones is never RBAC-gated — it's gated
 * by whether the signed-in user is that specific project's manager (see
 * the `isPM`/`isProjectManager` checks in the components that render those
 * actions, e.g. AllocationRow, ProjectTasksTab, ProjectOverviewTab).
 */
export interface ProjectPermissions {
  canViewModule: boolean;

  canAccessProjects: boolean;
  canAccessCalendar: boolean;
  canAccessReports: boolean;

  canViewProjects: boolean;
  canAddProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;

  canViewCalendar: boolean;
  canViewReports: boolean;
}

const anyAction = (p: { canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }) =>
  p.canView || p.canAdd || p.canEdit || p.canDelete;

export function useProjectPermissions(): ProjectPermissions {
  const modulePerms = useCan('HRM_PROJECT', 'project_module');
  const recordPerms = useCan('HRM_PROJECT', 'project_record');
  const calendarPerms = useCan('HRM_PROJECT', 'project_calendar');
  const reportPerms = useCan('HRM_PROJECT', 'project_report');

  return useMemo(
    () => ({
      canViewModule: modulePerms.canView,

      canAccessProjects: anyAction(recordPerms),
      canAccessCalendar: anyAction(calendarPerms),
      canAccessReports: anyAction(reportPerms),

      canViewProjects: recordPerms.canView,
      canAddProject: recordPerms.canAdd,
      canEditProject: recordPerms.canEdit,
      canDeleteProject: recordPerms.canDelete,

      canViewCalendar: calendarPerms.canView,
      canViewReports: reportPerms.canView,
    }),
    [modulePerms, recordPerms, calendarPerms, reportPerms],
  );
}
