import { create } from "zustand";
import type { TravelRequest, CoTravellerDto, TravelPolicy } from "../types/domain.types";
import type { TravelFormState, TravelScreenMode, TravelDetailTab, InboxTab } from "../types/ui.types";
import { DEFAULT_FORM_STATE } from "../utils/travelConstants";

interface TravelState {
  // ── Data ──────────────────────────────────────────────────────────────
  myRequests: TravelRequest[];
  approverInbox: TravelRequest[];
  selectedRequest: TravelRequest | null;
  eligibleCoTravellers: CoTravellerDto[];
  policies: TravelPolicy[];

  // ── Loading ───────────────────────────────────────────────────────────
  listLoading: boolean;
  inboxLoading: boolean;
  detailLoading: boolean;
  saving: boolean;
  submitting: boolean;
  approving: boolean;
  coTravellerSearchLoading: boolean;

  // ── Error ─────────────────────────────────────────────────────────────
  error: string | null;

  // ── UI ────────────────────────────────────────────────────────────────
  screenMode: TravelScreenMode;
  activeDetailTab: TravelDetailTab;
  activeInboxTab: InboxTab;
  formState: TravelFormState;

  // ── Filters ───────────────────────────────────────────────────────────
  searchTerm: string;
  statusFilter: string | null;
  typeFilter: string | null;
  dateRange: [string, string] | null;

  // ── Actions: Data ─────────────────────────────────────────────────────
  setMyRequests: (requests: TravelRequest[]) => void;
  addMyRequest: (request: TravelRequest) => void;
  updateMyRequest: (handle: string, changes: Partial<TravelRequest>) => void;
  removeMyRequest: (handle: string) => void;
  setApproverInbox: (requests: TravelRequest[]) => void;
  updateInboxRequest: (handle: string, changes: Partial<TravelRequest>) => void;
  removeFromInbox: (handle: string) => void;
  setSelectedRequest: (request: TravelRequest | null) => void;
  setEligibleCoTravellers: (travellers: CoTravellerDto[]) => void;
  setPolicies: (policies: TravelPolicy[]) => void;

  // ── Actions: Loading ──────────────────────────────────────────────────
  setListLoading: (loading: boolean) => void;
  setInboxLoading: (loading: boolean) => void;
  setDetailLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setApproving: (approving: boolean) => void;
  setCoTravellerSearchLoading: (loading: boolean) => void;

  // ── Actions: Error ────────────────────────────────────────────────────
  setError: (error: string | null) => void;

  // ── Actions: UI ───────────────────────────────────────────────────────
  setScreenMode: (mode: TravelScreenMode) => void;
  setActiveDetailTab: (tab: TravelDetailTab) => void;
  setActiveInboxTab: (tab: InboxTab) => void;
  updateFormState: (changes: Partial<TravelFormState>) => void;
  resetFormState: () => void;

  // ── Actions: Filters ──────────────────────────────────────────────────
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string | null) => void;
  setTypeFilter: (type: string | null) => void;
  setDateRange: (range: [string, string] | null) => void;

  reset: () => void;
}

const defaultState = {
  myRequests: [],
  approverInbox: [],
  selectedRequest: null,
  eligibleCoTravellers: [],
  policies: [],
  listLoading: false,
  inboxLoading: false,
  detailLoading: false,
  saving: false,
  submitting: false,
  approving: false,
  coTravellerSearchLoading: false,
  error: null,
  screenMode: "list" as TravelScreenMode,
  activeDetailTab: "details" as TravelDetailTab,
  activeInboxTab: "pending" as InboxTab,
  formState: { ...DEFAULT_FORM_STATE } as TravelFormState,
  searchTerm: "",
  statusFilter: null,
  typeFilter: null,
  dateRange: null,
};

export const useHrmTravelStore = create<TravelState>((set) => ({
  ...defaultState,

  setMyRequests: (myRequests) => set({ myRequests }),
  addMyRequest: (request) => set((s) => ({ myRequests: [request, ...s.myRequests] })),
  updateMyRequest: (handle, changes) =>
    set((s) => ({
      myRequests: s.myRequests.map((r) => (r.handle === handle ? { ...r, ...changes } : r)),
    })),
  removeMyRequest: (handle) =>
    set((s) => ({ myRequests: s.myRequests.filter((r) => r.handle !== handle) })),
  setApproverInbox: (approverInbox) => set({ approverInbox }),
  updateInboxRequest: (handle, changes) =>
    set((s) => ({
      approverInbox: s.approverInbox.map((r) => (r.handle === handle ? { ...r, ...changes } : r)),
    })),
  removeFromInbox: (handle) =>
    set((s) => ({ approverInbox: s.approverInbox.filter((r) => r.handle !== handle) })),
  setSelectedRequest: (selectedRequest) => set({ selectedRequest }),
  setEligibleCoTravellers: (eligibleCoTravellers) => set({ eligibleCoTravellers }),
  setPolicies: (policies) => set({ policies }),

  setListLoading: (listLoading) => set({ listLoading }),
  setInboxLoading: (inboxLoading) => set({ inboxLoading }),
  setDetailLoading: (detailLoading) => set({ detailLoading }),
  setSaving: (saving) => set({ saving }),
  setSubmitting: (submitting) => set({ submitting }),
  setApproving: (approving) => set({ approving }),
  setCoTravellerSearchLoading: (coTravellerSearchLoading) => set({ coTravellerSearchLoading }),

  setError: (error) => set({ error }),

  setScreenMode: (screenMode) => set({ screenMode }),
  setActiveDetailTab: (activeDetailTab) => set({ activeDetailTab }),
  setActiveInboxTab: (activeInboxTab) => set({ activeInboxTab }),
  updateFormState: (changes) =>
    set((s) => ({ formState: { ...s.formState, ...changes } })),
  resetFormState: () => set({ formState: { ...DEFAULT_FORM_STATE } as TravelFormState }),

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setDateRange: (dateRange) => set({ dateRange }),

  reset: () => set(defaultState),
}));
