import { useEffect, useMemo } from 'react';
import { useHrmRbacStore } from '@/modules/hrmAccess/stores/hrmRbacStore';

/**
 * Hook to manage Travel module permissions.
 * Loads object-level permissions and returns named flags per registered object.
 *
 * Object name mapping (registry → flag prefix):
 *   travel_module        → (root, used for module-level / isAdmin)
 *   travel_request       → Request
 *   travel_approval      → Approval
 *   travel_attachment    → Attachment
 *   travel_co_traveller  → CoTraveller
 *   travel_policy        → Policy
 *   travel_history       → History
 *
 * Fallback semantics:
 *   - If section cache is loaded (non-null), lookup is strict per-object.
 *     Missing object → denied. This enforces object-level RBAC.
 *   - If section cache is NOT loaded yet (null), fall back to module-level
 *     so the UI doesn't flash buttons during initial load.
 */
export const useTravelPermissions = () => {
  const loadSectionPermissions = useHrmRbacStore(s => s.loadSectionPermissions);
  const sectionPerms = useHrmRbacStore(s => s.getSectionPermissions('HRM_TRAVEL'));
  const moduleLevelPerms = useHrmRbacStore(s => s.permissionsByModule['HRM_TRAVEL']);
  const isReady = useHrmRbacStore(s => s.isReady);

  useEffect(() => {
    if (isReady) {
      loadSectionPermissions('HRM_TRAVEL');
    }
  }, [isReady, loadSectionPermissions]);

  const permissions = useMemo(() => {
    const DENIED = { canView: false, canAdd: false, canEdit: false, canDelete: false };

    const moduleFallback = {
      canView: moduleLevelPerms?.canView ?? false,
      canAdd: moduleLevelPerms?.canAdd ?? false,
      canEdit: moduleLevelPerms?.canEdit ?? false,
      canDelete: moduleLevelPerms?.canDelete ?? false,
    };

    const resolveObject = (objectName: string) => {
      if (sectionPerms) {
        return sectionPerms[objectName] || DENIED;
      }
      return moduleFallback;
    };

    const requestPerms = resolveObject('travel_request');
    const approvalPerms = resolveObject('travel_approval');
    const attachmentPerms = resolveObject('travel_attachment');
    const coTravellerPerms = resolveObject('travel_co_traveller');
    const policyPerms = resolveObject('travel_policy');
    const historyPerms = resolveObject('travel_history');

    // Module-level admin bypass: if the user has module-wide ADD or DELETE,
    // treat them as an admin so UI actions that depend on object-level
    // grants still render even when the backend hasn't returned an explicit
    // object entry yet.
    const isAdmin = Boolean(moduleLevelPerms?.canAdd || moduleLevelPerms?.canDelete);

    // RBAC-derived role hint, used by the landing for tab gating + data loads.
    // Convention (matches Leave): canDelete → HR/Admin, canEdit → Supervisor.
    const isHrAdmin = Boolean(approvalPerms.canDelete || policyPerms.canEdit);
    const isSupervisor = !isHrAdmin && Boolean(approvalPerms.canEdit || approvalPerms.canView);

    // Convenience flag — has the backend published any HRM_TRAVEL grant?
    // When false, the landing falls back to cookie role for legacy environments.
    const rbacPublished =
      requestPerms.canView ||
      requestPerms.canAdd ||
      requestPerms.canEdit ||
      requestPerms.canDelete ||
      approvalPerms.canView ||
      policyPerms.canView ||
      Boolean(moduleLevelPerms?.canView);

    return {
      isAdmin,
      isHrAdmin,
      isSupervisor,
      rbacPublished,

      // Request (My Travel Requests)
      canViewRequest: requestPerms.canView,
      canAddRequest: requestPerms.canAdd,
      canEditRequest: requestPerms.canEdit,
      canDeleteRequest: requestPerms.canDelete,

      // Approval (Supervisor / HR inbox + actions)
      canViewApproval: approvalPerms.canView,
      canApprove: approvalPerms.canEdit,
      canOverrideApproval: approvalPerms.canDelete,

      // Attachment
      canViewAttachment: attachmentPerms.canView,
      canAddAttachment: attachmentPerms.canAdd,
      canDeleteAttachment: attachmentPerms.canDelete,

      // Co-Traveller
      canViewCoTraveller: coTravellerPerms.canView,
      canAddCoTraveller: coTravellerPerms.canAdd,
      canRemoveCoTraveller: coTravellerPerms.canDelete,

      // Policy
      canViewPolicy: policyPerms.canView,
      canManagePolicy: policyPerms.canEdit || policyPerms.canAdd,

      // History / Reports
      canViewHistory: historyPerms.canView,

      raw: sectionPerms,
    };
  }, [sectionPerms, moduleLevelPerms]);

  return permissions;
};
