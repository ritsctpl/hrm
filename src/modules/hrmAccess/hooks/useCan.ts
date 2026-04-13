'use client';

import { useHrmRbacStore } from '../stores/hrmRbacStore';
import type { ModulePermissions } from '../stores/hrmRbacStore';
import { useModulePermissionContext } from '../context/ModulePermissionContext';

const EMPTY: ModulePermissions = { canView: false, canAdd: false, canEdit: false, canDelete: false };

/**
 * Returns the effective permissions for the current module — and optionally
 * for a specific object within that module.
 *
 * Resolution order:
 *   1. If `objectName` is provided, return object-level perms from the loaded
 *      section cache. Falls back to module-level perms if section data isn't
 *      loaded yet (or backend doesn't expose the object).
 *   2. If only `moduleCode` is provided, return that module's perms from the
 *      precomputed map (O(1) lookup).
 *   3. If neither is provided, return perms for the nearest ModuleAccessGate
 *      context.
 *
 * Object-level perms refine the module-level grant — e.g. an HR user with
 * module-wide HRM_LEAVE EDIT can still be restricted to only the
 * `approvalQueue` object, while regular employees only have `leaveRequest`.
 *
 * Section permissions are auto-loaded by ModuleAccessGate when a module is
 * mounted, so passing `objectName` "just works" inside the gated subtree.
 */
export function useCan(moduleCode?: string, objectName?: string): ModulePermissions {
  const ctx = useModulePermissionContext();

  const resolvedCode = moduleCode ?? ctx?.moduleCode ?? '';

  // Subscribe to STABLE references straight out of the Zustand store.
  // Selectors that build new objects every render (e.g. `{ state: ... }`)
  // break Zustand's referential-equality check and cause infinite renders —
  // so we read the cache slice directly and derive state in the component
  // body below.
  const cacheForModule = useHrmRbacStore(s =>
    resolvedCode ? s.sectionPermissionCache[resolvedCode] : undefined,
  );
  const moduleFromStore = useHrmRbacStore(s =>
    resolvedCode ? s.permissionsByModule[resolvedCode] : undefined,
  );

  // Object-level resolution rules:
  //   1. Cache loaded WITH object entries → strict lookup (no module fallback)
  //   2. Cache loaded but EMPTY → backend hasn't published object perms for
  //      this module; fall back to module-level grants.
  //   3. Cache not loaded yet → transient; fall back to module-level so the
  //      UI doesn't flicker buttons in/out during the initial load.
  if (objectName && resolvedCode) {
    const cacheLoadedWithObjects =
      cacheForModule !== undefined && Object.keys(cacheForModule).length > 0;
    if (cacheLoadedWithObjects) {
      return cacheForModule[objectName] || EMPTY;
    }
    return moduleFromStore || EMPTY;
  }

  if (!moduleCode && ctx) {
    return ctx.perms;
  }

  return moduleFromStore || EMPTY;
}
