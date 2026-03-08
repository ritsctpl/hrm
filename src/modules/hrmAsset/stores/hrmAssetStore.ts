/**
 * HRM Asset Module - Zustand Store
 */

import { create } from 'zustand';
import type {
  Asset,
  AssetCategory,
  AssetRequest,
  AssetDashboard,
  AssetCustody,
  AssetMaintenanceEvent,
  AssetDepreciationSnapshot,
  AssetDetailTab,
} from '../types/domain.types';

interface HrmAssetState {
  // UI state
  selectedAsset: Asset | null;
  selectedRequest: AssetRequest | null;
  activeTab: 'assets' | 'requests';
  activeDetailTab: AssetDetailTab;
  isAssetFormOpen: boolean;
  isRequestFormOpen: boolean;
  isAllocationPanelOpen: boolean;
  isReturnModalOpen: boolean;
  searchQuery: string;
  filterCategory: string;
  filterStatus: string;
  filterLocation: string;

  // Data state
  assets: Asset[];
  categories: AssetCategory[];
  myRequests: AssetRequest[];
  pendingSupervisorRequests: AssetRequest[];
  pendingAdminRequests: AssetRequest[];
  pendingAllocationRequests: AssetRequest[];
  dashboard: AssetDashboard | null;
  custodyHistory: AssetCustody[];
  maintenanceHistory: AssetMaintenanceEvent[];
  depreciationHistory: AssetDepreciationSnapshot[];

  // Loading state
  loadingAssets: boolean;
  loadingCategories: boolean;
  loadingRequests: boolean;
  loadingDashboard: boolean;
  loadingCustody: boolean;
  loadingMaintenance: boolean;
  loadingDepreciation: boolean;
  savingAsset: boolean;
  savingRequest: boolean;
  approvingRequest: boolean;
  allocatingAsset: boolean;
  runningDepreciation: boolean;

  // UI actions
  setSelectedAsset: (asset: Asset | null) => void;
  setSelectedRequest: (request: AssetRequest | null) => void;
  setActiveTab: (tab: 'assets' | 'requests') => void;
  setActiveDetailTab: (tab: AssetDetailTab) => void;
  openAssetForm: () => void;
  closeAssetForm: () => void;
  openRequestForm: () => void;
  closeRequestForm: () => void;
  openAllocationPanel: () => void;
  closeAllocationPanel: () => void;
  openReturnModal: () => void;
  closeReturnModal: () => void;
  setSearchQuery: (q: string) => void;
  setFilterCategory: (cat: string) => void;
  setFilterStatus: (status: string) => void;
  setFilterLocation: (loc: string) => void;
  clearFilters: () => void;

  // Data actions
  setAssets: (assets: Asset[]) => void;
  updateAssetInList: (assetId: string, changes: Partial<Asset>) => void;
  setCategories: (categories: AssetCategory[]) => void;
  setMyRequests: (requests: AssetRequest[]) => void;
  setPendingSupervisorRequests: (requests: AssetRequest[]) => void;
  setPendingAdminRequests: (requests: AssetRequest[]) => void;
  setPendingAllocationRequests: (requests: AssetRequest[]) => void;
  setDashboard: (dashboard: AssetDashboard) => void;
  setCustodyHistory: (history: AssetCustody[]) => void;
  setMaintenanceHistory: (history: AssetMaintenanceEvent[]) => void;
  setDepreciationHistory: (history: AssetDepreciationSnapshot[]) => void;

  // Loading actions
  setLoadingAssets: (v: boolean) => void;
  setLoadingCategories: (v: boolean) => void;
  setLoadingRequests: (v: boolean) => void;
  setLoadingDashboard: (v: boolean) => void;
  setLoadingCustody: (v: boolean) => void;
  setLoadingMaintenance: (v: boolean) => void;
  setLoadingDepreciation: (v: boolean) => void;
  setSavingAsset: (v: boolean) => void;
  setSavingRequest: (v: boolean) => void;
  setApprovingRequest: (v: boolean) => void;
  setAllocatingAsset: (v: boolean) => void;
  setRunningDepreciation: (v: boolean) => void;

  reset: () => void;
}

const defaultState = {
  selectedAsset: null as Asset | null,
  selectedRequest: null as AssetRequest | null,
  activeTab: 'assets' as const,
  activeDetailTab: 'overview' as AssetDetailTab,
  isAssetFormOpen: false,
  isRequestFormOpen: false,
  isAllocationPanelOpen: false,
  isReturnModalOpen: false,
  searchQuery: '',
  filterCategory: '',
  filterStatus: '',
  filterLocation: '',
  assets: [] as Asset[],
  categories: [] as AssetCategory[],
  myRequests: [] as AssetRequest[],
  pendingSupervisorRequests: [] as AssetRequest[],
  pendingAdminRequests: [] as AssetRequest[],
  pendingAllocationRequests: [] as AssetRequest[],
  dashboard: null as AssetDashboard | null,
  custodyHistory: [] as AssetCustody[],
  maintenanceHistory: [] as AssetMaintenanceEvent[],
  depreciationHistory: [] as AssetDepreciationSnapshot[],
  loadingAssets: false,
  loadingCategories: false,
  loadingRequests: false,
  loadingDashboard: false,
  loadingCustody: false,
  loadingMaintenance: false,
  loadingDepreciation: false,
  savingAsset: false,
  savingRequest: false,
  approvingRequest: false,
  allocatingAsset: false,
  runningDepreciation: false,
};

export const useHrmAssetStore = create<HrmAssetState>((set) => ({
  ...defaultState,

  setSelectedAsset: (asset) => set({ selectedAsset: asset, activeDetailTab: 'overview' }),
  setSelectedRequest: (request) => set({ selectedRequest: request }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveDetailTab: (tab) => set({ activeDetailTab: tab }),
  openAssetForm: () => set({ isAssetFormOpen: true }),
  closeAssetForm: () => set({ isAssetFormOpen: false }),
  openRequestForm: () => set({ isRequestFormOpen: true }),
  closeRequestForm: () => set({ isRequestFormOpen: false }),
  openAllocationPanel: () => set({ isAllocationPanelOpen: true }),
  closeAllocationPanel: () => set({ isAllocationPanelOpen: false }),
  openReturnModal: () => set({ isReturnModalOpen: true }),
  closeReturnModal: () => set({ isReturnModalOpen: false }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterCategory: (filterCategory) => set({ filterCategory }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterLocation: (filterLocation) => set({ filterLocation }),
  clearFilters: () => set({ searchQuery: '', filterCategory: '', filterStatus: '', filterLocation: '' }),

  setAssets: (assets) => set({ assets }),
  updateAssetInList: (assetId, changes) =>
    set((s) => ({
      assets: s.assets.map((a) => (a.assetId === assetId ? { ...a, ...changes } : a)),
      selectedAsset: s.selectedAsset?.assetId === assetId
        ? { ...s.selectedAsset, ...changes }
        : s.selectedAsset,
    })),
  setCategories: (categories) => set({ categories }),
  setMyRequests: (myRequests) => set({ myRequests }),
  setPendingSupervisorRequests: (r) => set({ pendingSupervisorRequests: r }),
  setPendingAdminRequests: (r) => set({ pendingAdminRequests: r }),
  setPendingAllocationRequests: (r) => set({ pendingAllocationRequests: r }),
  setDashboard: (dashboard) => set({ dashboard }),
  setCustodyHistory: (custodyHistory) => set({ custodyHistory }),
  setMaintenanceHistory: (maintenanceHistory) => set({ maintenanceHistory }),
  setDepreciationHistory: (depreciationHistory) => set({ depreciationHistory }),

  setLoadingAssets: (v) => set({ loadingAssets: v }),
  setLoadingCategories: (v) => set({ loadingCategories: v }),
  setLoadingRequests: (v) => set({ loadingRequests: v }),
  setLoadingDashboard: (v) => set({ loadingDashboard: v }),
  setLoadingCustody: (v) => set({ loadingCustody: v }),
  setLoadingMaintenance: (v) => set({ loadingMaintenance: v }),
  setLoadingDepreciation: (v) => set({ loadingDepreciation: v }),
  setSavingAsset: (v) => set({ savingAsset: v }),
  setSavingRequest: (v) => set({ savingRequest: v }),
  setApprovingRequest: (v) => set({ approvingRequest: v }),
  setAllocatingAsset: (v) => set({ allocatingAsset: v }),
  setRunningDepreciation: (v) => set({ runningDepreciation: v }),

  reset: () => set(defaultState),
}));
