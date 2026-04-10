'use client';

import { useHrmRbacStore } from '../stores/hrmRbacStore';
import type { ModulePermissions } from '../stores/hrmRbacStore';
import { useModulePermissionContext } from '../context/ModulePermissionContext';

const EMPTY: ModulePermissions = { canView: false, canAdd: false, canEdit: false, canDelete: false };

/**
 * Returns the current module's permissions.
 *
 * - Called with no args: uses the nearest <ModuleAccessGate> / context.
 *   This is the default and should be used inside a module's subtree.
 * - Called with a moduleCode: looks up permissions for that specific module,
 *   useful for cross-module widgets (e.g. a dashboard showing other modules'
 *   actions).
 *
 * The underlying store is O(1) — lookup is from a precomputed map. Zustand
 * selector ensures the component only re-renders when that module's perms
 * actually change (login / org switch).
 */
export function useCan(moduleCode?: string): ModulePermissions {
  const ctx = useModulePermissionContext();

  const resolvedCode = moduleCode ?? ctx?.moduleCode ?? '';

  // Subscribe only to this module's perms slice.
  const fromStore = useHrmRbacStore(s =>
    resolvedCode ? s.permissionsByModule[resolvedCode] : undefined,
  );

  // If moduleCode wasn't overridden, prefer context value (stable across renders).
  if (!moduleCode && ctx) {
    return ctx.perms;
  }

  return fromStore || EMPTY;
}
