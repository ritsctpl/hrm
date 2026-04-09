'use client';

import { useCallback } from 'react';
import { parseCookies } from 'nookies';
import { message } from 'antd';
import { HrmAssetService } from '../services/hrmAssetService';
import { useHrmAssetStore } from '../stores/hrmAssetStore';

export function useHrmAssetData() {
  const store = useHrmAssetStore();

  const getSite = () => parseCookies().site ?? '';
  const getUserId = () => parseCookies().userId ?? parseCookies().user ?? '';
  const getSupervisorId = () => parseCookies().supervisorId ?? getUserId();

  const loadDashboard = useCallback(async () => {
    store.setLoadingDashboard(true);
    try {
      const data = await HrmAssetService.getDashboard(getSite());
      store.setDashboard(data);
    } catch {
      // empty state shown in component
    } finally {
      store.setLoadingDashboard(false);
    }
  }, [store]);

  const loadCategories = useCallback(async () => {
    store.setLoadingCategories(true);
    try {
      const data = await HrmAssetService.getAllCategories(getSite());
      const categories = Array.isArray(data) ? data : [];
      // Deduplicate by categoryCode (defensive against backend duplicates)
      const seen = new Set<string>();
      const unique = categories.filter((c: { categoryCode: string }) => {
        if (seen.has(c.categoryCode)) return false;
        seen.add(c.categoryCode);
        return true;
      });
      store.setCategories(unique as unknown as Parameters<typeof store.setCategories>[0]);
    } catch {
      message.error('Failed to load categories');
    } finally {
      store.setLoadingCategories(false);
    }
  }, [store]);

  const loadAssets = useCallback(async () => {
    store.setLoadingAssets(true);
    try {
      const data = await HrmAssetService.getAllAssets(getSite());
      store.setAssets(data as unknown as Parameters<typeof store.setAssets>[0]);
    } catch {
      message.error('Failed to load assets');
    } finally {
      store.setLoadingAssets(false);
    }
  }, [store]);

  const loadMyRequests = useCallback(async () => {
    store.setLoadingRequests(true);
    try {
      const data = await HrmAssetService.getRequestsByEmployee(getSite(), getUserId());
      store.setMyRequests(data as unknown as Parameters<typeof store.setMyRequests>[0]);
    } catch {
      // silent
    } finally {
      store.setLoadingRequests(false);
    }
  }, [store]);

  const loadPendingApprovals = useCallback(async () => {
    store.setLoadingRequests(true);
    try {
      const [supervisor, admin, allocation] = await Promise.allSettled([
        HrmAssetService.getPendingForSupervisor(getSite(), getSupervisorId()),
        HrmAssetService.getPendingForAdmin(getSite()),
        HrmAssetService.getPendingAllocation(getSite()),
      ]);
      if (supervisor.status === 'fulfilled') {
        store.setPendingSupervisorRequests(supervisor.value as unknown as Parameters<typeof store.setPendingSupervisorRequests>[0]);
      }
      if (admin.status === 'fulfilled') {
        store.setPendingAdminRequests(admin.value as unknown as Parameters<typeof store.setPendingAdminRequests>[0]);
      }
      if (allocation.status === 'fulfilled') {
        store.setPendingAllocationRequests(allocation.value as unknown as Parameters<typeof store.setPendingAllocationRequests>[0]);
      }
    } finally {
      store.setLoadingRequests(false);
    }
  }, [store]);

  const loadAssetDetail = useCallback(async (assetId: string) => {
    store.setLoadingCustody(true);
    store.setLoadingMaintenance(true);
    store.setLoadingDepreciation(true);
    const site = getSite();
    try {
      const [custody, maintenance, depreciation] = await Promise.allSettled([
        HrmAssetService.getCustodyHistory(site, assetId),
        HrmAssetService.getMaintenanceHistory(site, assetId),
        HrmAssetService.getDepreciationHistory(site, assetId),
      ]);
      if (custody.status === 'fulfilled') store.setCustodyHistory(custody.value as unknown as Parameters<typeof store.setCustodyHistory>[0]);
      if (maintenance.status === 'fulfilled') store.setMaintenanceHistory(maintenance.value as unknown as Parameters<typeof store.setMaintenanceHistory>[0]);
      if (depreciation.status === 'fulfilled') store.setDepreciationHistory(depreciation.value as unknown as Parameters<typeof store.setDepreciationHistory>[0]);
    } finally {
      store.setLoadingCustody(false);
      store.setLoadingMaintenance(false);
      store.setLoadingDepreciation(false);
    }
  }, [store]);

  const initialLoad = useCallback(async () => {
    await Promise.all([loadDashboard(), loadCategories(), loadAssets()]);
  }, [loadDashboard, loadCategories, loadAssets]);

  return {
    loadDashboard,
    loadCategories,
    loadAssets,
    loadMyRequests,
    loadPendingApprovals,
    loadAssetDetail,
    initialLoad,
  };
}
