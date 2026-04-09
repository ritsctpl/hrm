'use client';

import { useMemo } from 'react';
import { useHrmAssetStore } from '../stores/hrmAssetStore';
import type { Asset } from '../types/domain.types';

export function useHrmAssetUI() {
  const store = useHrmAssetStore();

  const filteredAssets = useMemo((): Asset[] => {
    let list = store.assets;

    if (store.searchQuery) {
      const q = store.searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.assetId.toLowerCase().includes(q) ||
          a.assetName.toLowerCase().includes(q) ||
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
  }, [store.assets, store.searchQuery, store.filterCategory, store.filterStatus, store.filterLocation]);

  const approvalsBadgeCount = useMemo(
    () =>
      store.pendingSupervisorRequests.length +
      store.pendingAdminRequests.length +
      store.pendingAllocationRequests.length,
    [store.pendingSupervisorRequests, store.pendingAdminRequests, store.pendingAllocationRequests],
  );

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
