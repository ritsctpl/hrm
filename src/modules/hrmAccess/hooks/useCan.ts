'use client';

import { useHrmRbacStore } from '../stores/hrmRbacStore';
import type { ModulePermissions } from '../stores/hrmRbacStore';
import { useModulePermissionContext } from '../context/ModulePermissionContext';
import { getRootObjectCode } from '../utils/moduleObjectRegistry';

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
  //   1. Cache loaded (with or without entries) → strict lookup. If the
  //      requested objectName isn't in the cache, return EMPTY (denied).
  //      This enforces per-object grants: an object without an explicit
  //      grant is treated as denied even when the module-level grant is
  //      broader. The only escape hatch is the <Can passIf> prop.
  //   2. Cache not loaded yet → return EMPTY so buttons don't flash
  //      based on inflated module-level perms. Once section cache loads,
  //      rule 1 takes over. Root object cascade is already applied in
  //      the cache by loadSectionPermissions, so strict lookup is safe.
  if (objectName && resolvedCode) {
    if (cacheForModule !== undefined) {
      return cacheForModule[objectName] || EMPTY;
    }
    return EMPTY;
  }

  // Module-level check (no object specified): resolve via the root object
  // (e.g., employee_module) when the section cache is loaded. This gives
  // strict module-level V/A/E/D from the root object's grants instead of
  // the inflated actions from userModulesByOrganization.
  // Before cache loads, return EMPTY so isAdmin etc. start false.
  if (!objectName && resolvedCode) {
    const rootCode = getRootObjectCode(resolvedCode);
    if (rootCode && cacheForModule !== undefined) {
      return cacheForModule[rootCode] || EMPTY;
    }
    if (rootCode) return EMPTY;
  }

  if (!moduleCode && ctx) {
    return ctx.perms;
  }

  return moduleFromStore || EMPTY;
}
