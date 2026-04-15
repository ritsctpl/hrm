import { create } from "zustand";
import {
  LeaveBalance,
  LeaveRequest,
  LedgerEntry,
  AccrualBatch,
  LeaveType,
  LeavePolicy,
  ValidationSummary,
} from "../types/domain.types";
import { LeaveRequestFormState } from "../types/ui.types";

// ─── Supporting types ─────────────────────────────────────────────────────────

export interface GlobalQueueFilters {
  buId?: string;
  deptId?: string;
  supervisorId?: string;
  status?: string;
  leaveTypeCode?: string;
  slaBreachOnly?: boolean;
  fromDate?: string;
  toDate?: string;
}

export interface AccrualPreviewData {
  batchId: string;
  periodStart: string;
  periodEnd: string;
  quarter: string;
  year: number;
  totalEligibleEmployees: number;
  totalDaysToCredit: number;
  lines: AccrualPreviewLine[];
  errors: string[];
  canPost: boolean;
}

export interface AccrualPreviewLine {
  employeeId: string;
  employeeName: string;
  leaveTypeCode: string;
  daysToCredit: number;
  prorated: boolean;
  prorateReason?: string;
  excluded: boolean;
}

// ─── State ────────────────────────────────────────────────────────────────────

interface HrmLeaveState {
  balances: LeaveBalance[];
  balancesLoading: boolean;
  balancesYear: number;

  myRequests: LeaveRequest[];
  myRequestsLoading: boolean;

  pendingRequests: LeaveRequest[];
  pendingRequestsLoading: boolean;

  globalQueue: LeaveRequest[];
  globalQueueLoading: boolean;
  globalQueueFilters: GlobalQueueFilters;

  selectedRequest: LeaveRequest | null;
  selectedRequestLoading: boolean;

  ledgerHistory: LedgerEntry[];
  ledgerLoading: boolean;
  ledgerEmployeeId: string | null;
  ledgerYear: number;
  ledgerLeaveTypeFilter: string | null;

  balanceSummary: LeaveBalance[];
  balanceSummaryLoading: boolean;

  accrualPreview: AccrualPreviewData | null;
  accrualLoading: boolean;
  accrualBatches: AccrualBatch[];

  leaveTypes: LeaveType[];
  leaveTypesLoading: boolean;
  policies: LeavePolicy[];
  policiesLoading: boolean;

  validationSummary: ValidationSummary | null;
  validationLoading: boolean;

  activeTab: string;
  activeHrTab: string;
  showLeaveForm: boolean;
  leaveFormStep: 1 | 2 | 3 | 4;
  leaveFormState: LeaveRequestFormState;
  /** When set, the apply-leave drawer raises a request on behalf of this employee instead of the logged-in user. */
  formTargetEmployeeId: string | null;
  showRejectModal: boolean;
  showReassignModal: boolean;
  pendingActionRequestId: string | null;

  // Actions — Balances
  setBalances: (balances: LeaveBalance[]) => void;
  setBalancesLoading: (loading: boolean) => void;
  setBalancesYear: (year: number) => void;

  // Actions — My Requests
  setMyRequests: (requests: LeaveRequest[]) => void;
  setMyRequestsLoading: (loading: boolean) => void;
  addMyRequest: (request: LeaveRequest) => void;
  updateMyRequest: (handle: string, changes: Partial<LeaveRequest>) => void;

  // Actions — Pending (Approver)
  setPendingRequests: (requests: LeaveRequest[]) => void;
  setPendingRequestsLoading: (loading: boolean) => void;
  removeFromPending: (handle: string) => void;

  // Actions — HR Global Queue
  setGlobalQueue: (requests: LeaveRequest[]) => void;
  setGlobalQueueLoading: (loading: boolean) => void;
  setGlobalQueueFilters: (filters: Partial<GlobalQueueFilters>) => void;
  updateGlobalQueueRequest: (handle: string, changes: Partial<LeaveRequest>) => void;

  // Actions — Selected Request
  setSelectedRequest: (request: LeaveRequest | null) => void;
  setSelectedRequestLoading: (loading: boolean) => void;

  // Actions — Ledger
  setLedgerHistory: (entries: LedgerEntry[]) => void;
  setLedgerLoading: (loading: boolean) => void;
  setLedgerEmployeeId: (empId: string | null) => void;
  setLedgerYear: (year: number) => void;
  setLedgerLeaveTypeFilter: (code: string | null) => void;

  // Actions — Balance Summary
  setBalanceSummary: (summary: LeaveBalance[]) => void;
  setBalanceSummaryLoading: (loading: boolean) => void;

  // Actions — Accrual
  setAccrualPreview: (preview: AccrualPreviewData | null) => void;
  setAccrualLoading: (loading: boolean) => void;
  setAccrualBatches: (batches: AccrualBatch[]) => void;

  // Actions — Leave Types / Policies
  setLeaveTypes: (types: LeaveType[]) => void;
  setPolicies: (policies: LeavePolicy[]) => void;

  // Actions — Validation
  setValidationSummary: (summary: ValidationSummary | null) => void;
  setValidationLoading: (loading: boolean) => void;

  // Actions — UI
  setActiveTab: (tab: string) => void;
  setActiveHrTab: (tab: string) => void;
  openLeaveForm: (forEmployeeId?: string) => void;
  closeLeaveForm: () => void;
  setFormTargetEmployeeId: (id: string | null) => void;
  setLeaveFormStep: (step: 1 | 2 | 3 | 4) => void;
  updateLeaveFormState: (changes: Partial<LeaveRequestFormState>) => void;
  openRejectModal: (requestId: string) => void;
  closeRejectModal: () => void;
  openReassignModal: (requestId: string) => void;
  closeReassignModal: () => void;
  reset: () => void;
}

// ─── Default state ────────────────────────────────────────────────────────────

const defaultLeaveFormState: LeaveRequestFormState = {
  leaveTypeCode: null,
  startDate: null,
  endDate: null,
  startDayType: "FULL",
  endDayType: "FULL",
  totalDays: 0,
  reason: "",
  attachmentPath: null,
};

const defaultState = {
  balances: [],
  balancesLoading: false,
  balancesYear: new Date().getFullYear(),
  myRequests: [],
  myRequestsLoading: false,
  pendingRequests: [],
  pendingRequestsLoading: false,
  globalQueue: [],
  globalQueueLoading: false,
  globalQueueFilters: {},
  selectedRequest: null,
  selectedRequestLoading: false,
  ledgerHistory: [],
  ledgerLoading: false,
  ledgerEmployeeId: null,
  ledgerYear: new Date().getFullYear(),
  ledgerLeaveTypeFilter: null,
  balanceSummary: [],
  balanceSummaryLoading: false,
  accrualPreview: null,
  accrualLoading: false,
  accrualBatches: [],
  leaveTypes: [],
  leaveTypesLoading: false,
  policies: [],
  policiesLoading: false,
  validationSummary: null,
  validationLoading: false,
  activeTab: "requests",
  activeHrTab: "queue",
  showLeaveForm: false,
  leaveFormStep: 1 as const,
  leaveFormState: defaultLeaveFormState,
  formTargetEmployeeId: null,
  showRejectModal: false,
  showReassignModal: false,
  pendingActionRequestId: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useHrmLeaveStore = create<HrmLeaveState>((set) => ({
  ...defaultState,

  setBalances: (balances) => set({ balances }),
  setBalancesLoading: (balancesLoading) => set({ balancesLoading }),
  setBalancesYear: (balancesYear) => set({ balancesYear }),

  setMyRequests: (myRequests) => set({ myRequests }),
  setMyRequestsLoading: (myRequestsLoading) => set({ myRequestsLoading }),
  addMyRequest: (request) =>
    set((s) => ({ myRequests: [request, ...s.myRequests] })),
  updateMyRequest: (handle, changes) =>
    set((s) => ({
      myRequests: s.myRequests.map((r) =>
        r.handle === handle ? { ...r, ...changes } : r
      ),
    })),

  setPendingRequests: (pendingRequests) => set({ pendingRequests }),
  setPendingRequestsLoading: (pendingRequestsLoading) => set({ pendingRequestsLoading }),
  removeFromPending: (handle) =>
    set((s) => ({
      pendingRequests: s.pendingRequests.filter((r) => r.handle !== handle),
    })),

  setGlobalQueue: (globalQueue) => set({ globalQueue }),
  setGlobalQueueLoading: (globalQueueLoading) => set({ globalQueueLoading }),
  setGlobalQueueFilters: (filters) =>
    set((s) => ({ globalQueueFilters: { ...s.globalQueueFilters, ...filters } })),
  updateGlobalQueueRequest: (handle, changes) =>
    set((s) => ({
      globalQueue: s.globalQueue.map((r) =>
        r.handle === handle ? { ...r, ...changes } : r
      ),
    })),

  setSelectedRequest: (selectedRequest) => set({ selectedRequest }),
  setSelectedRequestLoading: (selectedRequestLoading) => set({ selectedRequestLoading }),

  setLedgerHistory: (ledgerHistory) => set({ ledgerHistory }),
  setLedgerLoading: (ledgerLoading) => set({ ledgerLoading }),
  setLedgerEmployeeId: (ledgerEmployeeId) => set({ ledgerEmployeeId }),
  setLedgerYear: (ledgerYear) => set({ ledgerYear }),
  setLedgerLeaveTypeFilter: (ledgerLeaveTypeFilter) => set({ ledgerLeaveTypeFilter }),

  setBalanceSummary: (balanceSummary) => set({ balanceSummary }),
  setBalanceSummaryLoading: (balanceSummaryLoading) => set({ balanceSummaryLoading }),

  setAccrualPreview: (accrualPreview) => set({ accrualPreview }),
  setAccrualLoading: (accrualLoading) => set({ accrualLoading }),
  setAccrualBatches: (accrualBatches) => set({ accrualBatches }),

  setLeaveTypes: (leaveTypes) => set({ leaveTypes }),
  setPolicies: (policies) => set({ policies }),

  setValidationSummary: (validationSummary) => set({ validationSummary }),
  setValidationLoading: (validationLoading) => set({ validationLoading }),

  setActiveTab: (activeTab) => set({ activeTab }),
  setActiveHrTab: (activeHrTab) => set({ activeHrTab }),
  openLeaveForm: (forEmployeeId) =>
    set({
      showLeaveForm: true,
      leaveFormStep: 1,
      leaveFormState: defaultLeaveFormState,
      validationSummary: null,
      formTargetEmployeeId: forEmployeeId ?? null,
    }),
  closeLeaveForm: () => set({ showLeaveForm: false, formTargetEmployeeId: null }),
  setFormTargetEmployeeId: (formTargetEmployeeId) => set({ formTargetEmployeeId }),
  setLeaveFormStep: (leaveFormStep) => set({ leaveFormStep }),
  updateLeaveFormState: (changes) =>
    set((s) => ({
      leaveFormState: { ...s.leaveFormState, ...changes },
    })),
  openRejectModal: (requestId) =>
    set({ showRejectModal: true, pendingActionRequestId: requestId }),
  closeRejectModal: () =>
    set({ showRejectModal: false, pendingActionRequestId: null }),
  openReassignModal: (requestId) =>
    set({ showReassignModal: true, pendingActionRequestId: requestId }),
  closeReassignModal: () =>
    set({ showReassignModal: false, pendingActionRequestId: null }),
  reset: () => set(defaultState),
}));
