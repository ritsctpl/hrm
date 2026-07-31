'use client';

import { useCan } from '@/modules/hrmAccess/hooks/useCan';
import { useSectionPermissions } from '@/modules/hrmAccess/hooks/useSectionPermissions';

/**
 * Single source of truth for "may this user hand an asset directly to an
 * employee, with no request and no approval chain?".
 *
 * Mapped onto the ADD grant of the `asset_direct_assign` object rather than
 * `asset_record` EDIT: editing the asset register and giving assets away
 * approval-free are different privileges, and conflating them is exactly what
 * the feature design set out to avoid.
 *
 * Returns false while the section permission cache is still loading (useCan
 * returns EMPTY until then), so the control never flashes for a user who turns
 * out to lack the grant.
 *
 * This gate is a convenience measure; the enforcement lives in the service,
 * which re-checks the same HRM_ASSET / asset_direct_assign / ADD grant on every
 * direct assignment and answers 403 PERMISSION_DENIED when it is absent. Keep
 * the module/object/action triple here identical to the one the service checks
 * — they are matched by string, so a rename on either side silently diverges.
 *
 * Note on ADD vs EDIT: the service checks the ADD action, but the RBAC store
 * overwrites every non-root object's `canAdd` with its `canEdit`
 * (hrmRbacStore.ts, "Object-level Add and Delete are no longer surfaced in the
 * role editor"). So the object needs BOTH ticked in Access Control — EDIT for
 * this hook to return true, ADD for the service to authorise the call. Ticking
 * only one gives either an invisible button or a 403 on submit.
 */
export function useCanDirectAssign(): boolean {
  // Ensures the HRM_ASSET object-level cache is loaded even when this hook is
  // called from outside the asset module (the employee record's Assets tab),
  // where no <ModuleAccessGate moduleCode="HRM_ASSET"> has run. The store
  // de-duplicates, so inside the asset module this is a no-op.
  useSectionPermissions('HRM_ASSET');

  return useCan('HRM_ASSET', 'asset_direct_assign').canAdd;
}
