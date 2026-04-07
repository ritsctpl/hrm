/**
 * Convenience hooks for common permission patterns in modules
 */

import { usePermissionsStore, usePermission } from '@/stores/permissionsStore';

/**
 * Hook for standard CRUD permissions on a module object
 * Returns an object with canView, canAdd, canEdit, canDelete
 */
export const useCrudPermissions = (moduleCode: string, objectName: string) => {
  const canView = usePermission(moduleCode, objectName, 'VIEW');
  const canAdd = usePermission(moduleCode, objectName, 'ADD');
  const canEdit = usePermission(moduleCode, objectName, 'EDIT');
  const canDelete = usePermission(moduleCode, objectName, 'DELETE');

  return {
    canView,
    canAdd,
    canEdit,
    canDelete,
    hasAnyPermission: canView || canAdd || canEdit || canDelete,
  };
};

/**
 * Hook to check if user has any of the specified actions
 */
export const useHasAnyPermission = (
  moduleCode: string,
  objectName: string,
  actions: string[]
) => {
  const hasPermission = usePermissionsStore((state) => state.hasPermission);
  
  return actions.some((action) => hasPermission(moduleCode, objectName, action));
};

/**
 * Hook to check if user has all of the specified actions
 */
export const useHasAllPermissions = (
  moduleCode: string,
  objectName: string,
  actions: string[]
) => {
  const hasPermission = usePermissionsStore((state) => state.hasPermission);
  
  return actions.every((action) => hasPermission(moduleCode, objectName, action));
};

/**
 * Hook to get permission summary for a module
 * Useful for debugging or displaying permission info
 */
export const usePermissionSummary = (moduleCode: string) => {
  const getModulePermissions = usePermissionsStore((state) => state.getModulePermissions);
  const permissions = getModulePermissions(moduleCode);

  const summary = {
    total: permissions.length,
    byObject: {} as Record<string, string[]>,
    byAction: {} as Record<string, number>,
  };

  permissions.forEach((p) => {
    // Group by object
    if (!summary.byObject[p.objectName]) {
      summary.byObject[p.objectName] = [];
    }
    summary.byObject[p.objectName].push(p.action);

    // Count by action
    summary.byAction[p.action] = (summary.byAction[p.action] || 0) + 1;
  });

  return summary;
};
