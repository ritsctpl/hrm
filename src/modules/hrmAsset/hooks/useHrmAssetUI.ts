'use client';

import { useMemo } from 'react';
import { parseCookies } from 'nookies';
import { useHrmAssetStore } from '../stores/hrmAssetStore';
import { useCan } from '../../hrmAccess/hooks/useCan';
import { useHrmRbacStore } from '../../hrmAccess/stores/hrmRbacStore';
import { useCurrentEmployeeStore } from '../../hrmAccess/stores/currentEmployeeStore';
import type { Asset } from '../types/domain.types';

// Profile roles that grant full asset visibility (admin). Compared
// case-insensitively, so any letter casing is accepted.
const ADMIN_ROLES = ['system administrator', 'director', 'admin'];

export function useHrmAssetUI() {
  const store = useHrmAssetStore();

  // Role grants drive how the approval badge is counted (mirrors the tab
  // visibility in HrmAssetLanding):
  //   asset_all_approval (admin)      → Supervisor + Admin + Allocation queues
  //   asset_approval (reporting mgr)  → Supervisor queue only
  //   neither                         → no approval count
  const isAdmin = useCan('HRM_ASSET', 'asset_all_approval').canView;
  const isSupervisor = useCan('HRM_ASSET', 'asset_approval').canView || isAdmin;

  // ── Admin detection by profile role ─────────────────────────────────────
  // The signed-in user's profile (employee/profile) is loaded on screen load
  // into currentEmployeeStore. If officialDetails.role is "System
  // Administrator" (or the user is a super admin) → Admin → see ALL assets.
  // Everyone else sees only the assets allocated to them — matched via the
  // employeeCode cookie against each asset's currentHolderEmployeeId.
  const cookies = parseCookies();
  const isSuperAdmin = useHrmRbacStore((s) => s.isSuperAdmin);
  const currentRole = useCurrentEmployeeStore((s) => s.data?.role ?? '');
  const isAdminRole = ADMIN_ROLES.includes(currentRole.trim().toLowerCase());
  // Drive "see all assets" off the RBAC admin permission (isAdmin, above) as well —
  // the profile-role check only works when the login matches the employee's workEmail,
  // so a username login (e.g. rits_hrm_admin) whose employee profile can't be resolved
  // would otherwise be treated as a plain employee and see no unassigned assets.
  const seesAllAssets = isSuperAdmin || isAdminRole || isAdmin;
  const currentEmployeeCode = (cookies.employeeCode ?? '').trim();

  const filteredAssets = useMemo((): Asset[] => {
    let list = store.assets;

    // Allocation-based visibility (non-admins): keep only assets whose current
    // holder matches the signed-in employee's code.
    if (!seesAllAssets) {
      list = currentEmployeeCode
        ? list.filter((a) => (a.currentHolderEmployeeId ?? '').trim() === currentEmployeeCode)
        : [];
    }

    if (store.searchQuery) {
      const q = store.searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          (a.assetId ?? '').toLowerCase().includes(q) ||
          (a.assetName ?? '').toLowerCase().includes(q) ||
          (a.categoryName ?? '').toLowerCase().includes(q) ||
          (a.currentHolderName ?? '').toLowerCase().includes(q) ||
          (a.vendor ?? '').toLowerCase().includes(q) ||
          (a.location ?? '').toLowerCase().includes(q) ||
          (a.status ?? '').toLowerCase().includes(q) ||
          (a.invoiceNo ?? '').toLowerCase().includes(q),
      );
    }

    if (store.filterCategory) {
      list = list.filter((a) => a.categoryCode === store.filterCategory);
    }

    if (store.filterStatus) {
      list = list.filter((a) => a.status === store.filterStatus);
    }

    if (store.filterLocation) {
      const loc = store.filterLocation.toLowerCase();
      list = list.filter((a) => (a.location ?? '').toLowerCase().includes(loc));
    }

    return list;
  }, [store.assets, store.searchQuery, store.filterCategory, store.filterStatus, store.filterLocation, seesAllAssets, currentEmployeeCode]);

  // Count only the queues the logged-in user is actually responsible for, so a
  // pure supervisor's badge doesn't include admin/allocation items (and a
  // plain user sees no approval count at all).
  const approvalsBadgeCount = useMemo(() => {
    if (isAdmin) {
      return (
        store.pendingSupervisorRequests.length +
        store.pendingAdminRequests.length +
        store.pendingAllocationRequests.length
      );
    }
    if (isSupervisor) {
      return store.pendingSupervisorRequests.length;
    }
    return 0;
  }, [
    isAdmin,
    isSupervisor,
    store.pendingSupervisorRequests,
    store.pendingAdminRequests,
    store.pendingAllocationRequests,
  ]);

  const requestsBadgeCount = store.myRequests.length;

  return {
    filteredAssets,
    approvalsBadgeCount,
    requestsBadgeCount,
    // Proxy store state for convenience
    activeTab: store.activeTab,
    selectedAsset: store.selectedAsset,
    isAssetFormOpen: store.isAssetFormOpen,
    isRequestFormOpen: store.isRequestFormOpen,
    isAllocationPanelOpen: store.isAllocationPanelOpen,
    isReturnModalOpen: store.isReturnModalOpen,
  };
}
