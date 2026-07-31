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

/**
 * Which side of a direct assignment is already decided.
 *
 * `asset`    — opened from the asset list / asset detail: the asset is locked
 *              and the user picks the employee.
 * `employee` — opened from an employee record: the employee is locked and the
 *              user picks from the in-store assets. This is the onboarding-kit
 *              path, where several assets go to one person in sequence.
 * `bulk`     — opened from the asset-list toolbar with several rows ticked: the
 *              asset set is fixed (rows removable) and one employee/date/reason
 *              applies to all of them.
 */
export type AssignModalContext =
  | { kind: 'asset'; assetId: string }
  | { kind: 'employee'; employeeId: string; employeeName?: string }
  | { kind: 'bulk'; assetIds: string[] };

interface HrmAssetState {
  // UI state
  selectedAsset: Asset | null;
  selectedRequest: AssetRequest | null;
  // Fully-hydrated detail for the selected request (full approvalHistory).
  // The list rows can be thin projections, so the detail panel reads this.
  requestDetail: AssetRequest | null;
  // The request currently being edited in the edit drawer.
  editingRequest: AssetRequest | null;
  activeTab: 'assets' | 'requests' | 'teamHistory';
  activeDetailTab: AssetDetailTab;
  isAssetFormOpen: boolean;
  isRequestFormOpen: boolean;
  isEditRequestDrawerOpen: boolean;
  isAllocationPanelOpen: boolean;
  isReturnModalOpen: boolean;
  assignModalContext: AssignModalContext | null;
  /**
   * Asset IDs ticked in the list for a bulk direct assignment. Held in the
   * store rather than the list component so the toolbar button (a sibling of
   * the list) can read the count and hand the set to the modal.
   */
  bulkAssignSelection: string[];
  searchQuery: string;
  filterCategory: string;
  filterStatus: string;
  filterLocation: string;

  // Data state
  assets: Asset[];
  // Supervisor's team-wide asset list, backing the Team History tab. Kept
  // separate from `assets` (the caller's own list) so the two tabs don't
  // clobber each other.
  teamHistoryAssets: Asset[];
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
  loadingTeamHistory: boolean;
  loadingCategories: boolean;
  loadingRequests: boolean;
  loadingRequestDetail: boolean;
  loadingDashboard: boolean;
  loadingAssetDetail: boolean;
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
  setRequestDetail: (request: AssetRequest | null) => void;
  setActiveTab: (tab: 'assets' | 'requests' | 'teamHistory') => void;
  setActiveDetailTab: (tab: AssetDetailTab) => void;
  openAssetForm: () => void;
  closeAssetForm: () => void;
  openRequestForm: () => void;
  closeRequestForm: () => void;
  openEditRequestDrawer: (request: AssetRequest) => void;
  closeEditRequestDrawer: () => void;
  openAllocationPanel: () => void;
  closeAllocationPanel: () => void;
  openReturnModal: () => void;
  closeReturnModal: () => void;
  openAssignModal: (ctx: AssignModalContext) => void;
  closeAssignModal: () => void;
  toggleBulkAssignSelection: (assetId: string) => void;
  setBulkAssignSelection: (assetIds: string[]) => void;
  clearBulkAssignSelection: () => void;
  setSearchQuery: (q: string) => void;
  setFilterCategory: (cat: string) => void;
  setFilterStatus: (status: string) => void;
  setFilterLocation: (loc: string) => void;
  clearFilters: () => void;

  // Data actions
  setAssets: (assets: Asset[]) => void;
  setTeamHistoryAssets: (assets: Asset[]) => void;
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
  setLoadingTeamHistory: (v: boolean) => void;
  setLoadingCategories: (v: boolean) => void;
  setLoadingRequests: (v: boolean) => void;
  setLoadingRequestDetail: (v: boolean) => void;
  setLoadingDashboard: (v: boolean) => void;
  setLoadingAssetDetail: (v: boolean) => void;
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
  requestDetail: null as AssetRequest | null,
  editingRequest: null as AssetRequest | null,
  activeTab: 'assets' as const,
  activeDetailTab: 'overview' as AssetDetailTab,
  isAssetFormOpen: false,
  isRequestFormOpen: false,
  isEditRequestDrawerOpen: false,
  isAllocationPanelOpen: false,
  isReturnModalOpen: false,
  assignModalContext: null,
  bulkAssignSelection: [],
  searchQuery: '',
  filterCategory: '',
  filterStatus: '',
  filterLocation: '',
  assets: [] as Asset[],
  teamHistoryAssets: [] as Asset[],
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
  loadingTeamHistory: false,
  loadingCategories: false,
  loadingRequests: false,
  loadingRequestDetail: false,
  loadingDashboard: false,
  loadingAssetDetail: false,
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

  // Drop the outgoing asset's detail lists along with the selection. They are
  // keyed to the asset that was showing, so keeping them means the new asset's
  // panel renders the previous one's custody/maintenance/depreciation rows
  // until the refetch lands. Same reasoning as setSelectedRequest below.
  setSelectedAsset: (asset) =>
    set({
      selectedAsset: asset,
      activeDetailTab: 'overview',
      custodyHistory: [],
      maintenanceHistory: [],
      depreciationHistory: [],
    }),
  // Selecting a request resets the cached detail so the panel shows a
  // loading state until the fresh detail (with full history) arrives.
  setSelectedRequest: (request) => set({ selectedRequest: request, requestDetail: null }),
  setRequestDetail: (request) => set({ requestDetail: request }),
  /**
   * Switching tabs clears the asset selection.
   *
   * The Assets tab and Team History are two different lists that share one
   * `selectedAsset` slice, and each renders its own detail panel from it. Left
   * alone, picking an asset on Assets and switching to Team History shows that
   * asset in the team panel — an asset that need not even be in the team list,
   * and vice versa. Clearing makes each tab open on its own empty state.
   *
   * Guarded so a no-op set (same tab) never discards a live selection.
   */
  setActiveTab: (tab) =>
    set((s) =>
      s.activeTab === tab
        ? { activeTab: tab }
        : {
            activeTab: tab,
            selectedAsset: null,
            activeDetailTab: 'overview',
            custodyHistory: [],
            maintenanceHistory: [],
            depreciationHistory: [],
          },
    ),
  setActiveDetailTab: (tab) => set({ activeDetailTab: tab }),
  openAssetForm: () => set({ isAssetFormOpen: true }),
  closeAssetForm: () => set({ isAssetFormOpen: false }),
  openRequestForm: () => set({ isRequestFormOpen: true }),
  closeRequestForm: () => set({ isRequestFormOpen: false }),
  openEditRequestDrawer: (request) => set({ editingRequest: request, isEditRequestDrawerOpen: true }),
  closeEditRequestDrawer: () => set({ editingRequest: null, isEditRequestDrawerOpen: false }),
  openAllocationPanel: () => set({ isAllocationPanelOpen: true }),
  closeAllocationPanel: () => set({ isAllocationPanelOpen: false }),
  openReturnModal: () => set({ isReturnModalOpen: true }),
  closeReturnModal: () => set({ isReturnModalOpen: false }),
  openAssignModal: (assignModalContext) => set({ assignModalContext }),
  closeAssignModal: () => set({ assignModalContext: null }),
  toggleBulkAssignSelection: (assetId) =>
    set((s) => ({
      bulkAssignSelection: s.bulkAssignSelection.includes(assetId)
        ? s.bulkAssignSelection.filter((id) => id !== assetId)
        : [...s.bulkAssignSelection, assetId],
    })),
  setBulkAssignSelection: (bulkAssignSelection) => set({ bulkAssignSelection }),
  clearBulkAssignSelection: () => set({ bulkAssignSelection: [] }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterCategory: (filterCategory) => set({ filterCategory }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterLocation: (filterLocation) => set({ filterLocation }),
  clearFilters: () => set({ searchQuery: '', filterCategory: '', filterStatus: '', filterLocation: '' }),

  setAssets: (assets) => set({ assets }),
  setTeamHistoryAssets: (teamHistoryAssets) => set({ teamHistoryAssets }),
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
  setLoadingTeamHistory: (v) => set({ loadingTeamHistory: v }),
  setLoadingCategories: (v) => set({ loadingCategories: v }),
  setLoadingRequests: (v) => set({ loadingRequests: v }),
  setLoadingRequestDetail: (v) => set({ loadingRequestDetail: v }),
  setLoadingDashboard: (v) => set({ loadingDashboard: v }),
  setLoadingAssetDetail: (v) => set({ loadingAssetDetail: v }),
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
