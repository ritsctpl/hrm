import { create } from "zustand";
import { PolicyDocument, PolicyCategory, PolicyVersion, AcknowledgmentReport } from "../types/domain.types";

interface HrmPolicyState {
  // Library data
  policies: PolicyDocument[];
  policiesLoading: boolean;
  categories: PolicyCategory[];
  categoriesLoading: boolean;

  // Selected policy
  selectedPolicy: PolicyDocument | null;
  selectedPolicyLoading: boolean;
  versionHistory: PolicyVersion[];
  versionHistoryLoading: boolean;

  // Admin data
  adminPolicies: PolicyDocument[];
  adminPoliciesLoading: boolean;
  ackReport: AcknowledgmentReport | null;
  ackReportLoading: boolean;

  // UI state
  activeTab: "library" | "admin";
  viewMode: "grid" | "list";
  showPolicyViewer: boolean;
  showFormDrawer: boolean;
  editPolicy: PolicyDocument | null;
  searchText: string;
  filterCategoryId: string;
  filterDocType: string;
  filterStatus: string;

  // Loading/action states
  acknowledging: boolean;
  publishing: boolean;
  archiving: boolean;
  saving: boolean;

  // Actions
  setPolicies: (policies: PolicyDocument[]) => void;
  setPoliciesLoading: (v: boolean) => void;
  setCategories: (categories: PolicyCategory[]) => void;
  setCategoriesLoading: (v: boolean) => void;
  setSelectedPolicy: (policy: PolicyDocument | null) => void;
  setSelectedPolicyLoading: (v: boolean) => void;
  setVersionHistory: (history: PolicyVersion[]) => void;
  setVersionHistoryLoading: (v: boolean) => void;
  setAdminPolicies: (policies: PolicyDocument[]) => void;
  setAdminPoliciesLoading: (v: boolean) => void;
  setAckReport: (report: AcknowledgmentReport | null) => void;
  setAckReportLoading: (v: boolean) => void;
  setActiveTab: (tab: "library" | "admin") => void;
  setViewMode: (mode: "grid" | "list") => void;
  openPolicyViewer: (policy: PolicyDocument) => void;
  closePolicyViewer: () => void;
  openFormDrawer: (policy?: PolicyDocument | null) => void;
  closeFormDrawer: () => void;
  setSearchText: (text: string) => void;
  setFilterCategoryId: (id: string) => void;
  setFilterDocType: (type: string) => void;
  setFilterStatus: (status: string) => void;
  setAcknowledging: (v: boolean) => void;
  setPublishing: (v: boolean) => void;
  setArchiving: (v: boolean) => void;
  setSaving: (v: boolean) => void;
  updatePolicyAckStatus: (policyId: string, ackDate: string) => void;
}

export const useHrmPolicyStore = create<HrmPolicyState>((set) => ({
  policies: [],
  policiesLoading: false,
  categories: [],
  categoriesLoading: false,
  selectedPolicy: null,
  selectedPolicyLoading: false,
  versionHistory: [],
  versionHistoryLoading: false,
  adminPolicies: [],
  adminPoliciesLoading: false,
  ackReport: null,
  ackReportLoading: false,
  activeTab: "library",
  viewMode: "grid",
  showPolicyViewer: false,
  showFormDrawer: false,
  editPolicy: null,
  searchText: "",
  filterCategoryId: "",
  filterDocType: "",
  filterStatus: "PUBLISHED",
  acknowledging: false,
  publishing: false,
  archiving: false,
  saving: false,

  setPolicies: (policies) => set({ policies }),
  setPoliciesLoading: (policiesLoading) => set({ policiesLoading }),
  setCategories: (categories) => set({ categories }),
  setCategoriesLoading: (categoriesLoading) => set({ categoriesLoading }),
  setSelectedPolicy: (selectedPolicy) => set({ selectedPolicy }),
  setSelectedPolicyLoading: (selectedPolicyLoading) => set({ selectedPolicyLoading }),
  setVersionHistory: (versionHistory) => set({ versionHistory }),
  setVersionHistoryLoading: (versionHistoryLoading) => set({ versionHistoryLoading }),
  setAdminPolicies: (adminPolicies) => set({ adminPolicies }),
  setAdminPoliciesLoading: (adminPoliciesLoading) => set({ adminPoliciesLoading }),
  setAckReport: (ackReport) => set({ ackReport }),
  setAckReportLoading: (ackReportLoading) => set({ ackReportLoading }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setViewMode: (viewMode) => set({ viewMode }),
  openPolicyViewer: (policy) => set({ showPolicyViewer: true, selectedPolicy: policy }),
  closePolicyViewer: () => set({ showPolicyViewer: false, selectedPolicy: null }),
  openFormDrawer: (policy = null) => set({ showFormDrawer: true, editPolicy: policy }),
  closeFormDrawer: () => set({ showFormDrawer: false, editPolicy: null }),
  setSearchText: (searchText) => set({ searchText }),
  setFilterCategoryId: (filterCategoryId) => set({ filterCategoryId }),
  setFilterDocType: (filterDocType) => set({ filterDocType }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setAcknowledging: (acknowledging) => set({ acknowledging }),
  setPublishing: (publishing) => set({ publishing }),
  setArchiving: (archiving) => set({ archiving }),
  setSaving: (saving) => set({ saving }),
  updatePolicyAckStatus: (policyId, ackDate) =>
    set((s) => ({
      policies: s.policies.map((p) =>
        p.id === policyId ? { ...p, ackStatus: "ACKNOWLEDGED" as const, acknowledgedAt: ackDate } : p
      ),
      selectedPolicy:
        s.selectedPolicy?.id === policyId
          ? { ...s.selectedPolicy, ackStatus: "ACKNOWLEDGED" as const, acknowledgedAt: ackDate }
          : s.selectedPolicy,
    })),
}));
