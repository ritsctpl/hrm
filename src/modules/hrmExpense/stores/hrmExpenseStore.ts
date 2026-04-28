import { create } from "zustand";
import type { ExpenseReport, ExpenseCategory, MileageConfig } from "../types/domain.types";
import type {
  ExpenseFormState,
  ExpenseScreenMode,
  ExpenseDetailTab,
  ExpenseInboxTab,
  FinancePanelState,
} from "../types/ui.types";
import { DEFAULT_EXPENSE_FORM, DEFAULT_FINANCE_PANEL } from "../utils/expenseConstants";

interface ExpenseState {
  // ── Data ──────────────────────────────────────────────────────────────
  myExpenses: ExpenseReport[];
  supervisorInbox: ExpenseReport[];
  financeInbox: ExpenseReport[];
  selectedExpense: ExpenseReport | null;
  categories: ExpenseCategory[];
  mileageConfig: MileageConfig | null;

  // ── Loading ───────────────────────────────────────────────────────────
  listLoading: boolean;
  inboxLoading: boolean;
  detailLoading: boolean;
  saving: boolean;
  submitting: boolean;
  approving: boolean;

  // ── Error ─────────────────────────────────────────────────────────────
  error: string | null;

  // ── UI ────────────────────────────────────────────────────────────────
  screenMode: ExpenseScreenMode;
  activeDetailTab: ExpenseDetailTab;
  activeSupervisorInboxTab: ExpenseInboxTab;
  activeFinanceInboxTab: ExpenseInboxTab;
  formState: ExpenseFormState;
  financePanel: FinancePanelState;
  draftItems: ExpenseReport["items"];

  // ── Filters ───────────────────────────────────────────────────────────
  searchTerm: string;
  statusFilter: string | null;
  typeFilter: string | null;
  dateRange: [string, string] | null;

  // ── Actions: Data ─────────────────────────────────────────────────────
  setMyExpenses: (expenses: ExpenseReport[]) => void;
  addMyExpense: (expense: ExpenseReport) => void;
  updateMyExpense: (handle: string, changes: Partial<ExpenseReport>) => void;
  removeMyExpense: (handle: string) => void;
  setSupervisorInbox: (expenses: ExpenseReport[]) => void;
  setFinanceInbox: (expenses: ExpenseReport[]) => void;
  updateInboxExpense: (handle: string, changes: Partial<ExpenseReport>) => void;
  removeFromInbox: (handle: string) => void;
  setSelectedExpense: (expense: ExpenseReport | null) => void;
  setCategories: (categories: ExpenseCategory[]) => void;
  setMileageConfig: (config: MileageConfig | null) => void;

  // ── Actions: Loading ──────────────────────────────────────────────────
  setListLoading: (loading: boolean) => void;
  setInboxLoading: (loading: boolean) => void;
  setDetailLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setApproving: (approving: boolean) => void;

  // ── Actions: Error ────────────────────────────────────────────────────
  setError: (error: string | null) => void;

  // ── Actions: UI ───────────────────────────────────────────────────────
  setScreenMode: (mode: ExpenseScreenMode) => void;
  setActiveDetailTab: (tab: ExpenseDetailTab) => void;
  setActiveSupervisorInboxTab: (tab: ExpenseInboxTab) => void;
  setActiveFinanceInboxTab: (tab: ExpenseInboxTab) => void;
  updateFormState: (changes: Partial<ExpenseFormState>) => void;
  resetFormState: () => void;
  updateFinancePanel: (changes: Partial<FinancePanelState>) => void;
  resetFinancePanel: () => void;
  setDraftItems: (items: ExpenseReport["items"]) => void;
  addDraftItem: (item: ExpenseReport["items"][number]) => void;
  updateDraftItem: (handle: string, changes: Partial<ExpenseReport["items"][number]>) => void;
  removeDraftItem: (handle: string) => void;
  resetDraftItems: () => void;

  // ── Actions: Filters ──────────────────────────────────────────────────
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string | null) => void;
  setTypeFilter: (type: string | null) => void;
  setDateRange: (range: [string, string] | null) => void;

  reset: () => void;
}

const defaultState = {
  myExpenses: [],
  supervisorInbox: [],
  financeInbox: [],
  selectedExpense: null,
  categories: [],
  mileageConfig: null,
  listLoading: false,
  inboxLoading: false,
  detailLoading: false,
  saving: false,
  submitting: false,
  approving: false,
  error: null,
  screenMode: "list" as ExpenseScreenMode,
  activeDetailTab: "header" as ExpenseDetailTab,
  activeSupervisorInboxTab: "pending" as ExpenseInboxTab,
  activeFinanceInboxTab: "pending" as ExpenseInboxTab,
  formState: { ...DEFAULT_EXPENSE_FORM },
  financePanel: { ...DEFAULT_FINANCE_PANEL },
  draftItems: [],
  searchTerm: "",
  statusFilter: null,
  typeFilter: null,
  dateRange: null,
};

export const useHrmExpenseStore = create<ExpenseState>((set) => ({
  ...defaultState,

  setMyExpenses: (myExpenses) => set({ myExpenses }),
  addMyExpense: (expense) => set((s) => ({ myExpenses: [expense, ...s.myExpenses] })),
  updateMyExpense: (handle, changes) =>
    set((s) => ({
      myExpenses: s.myExpenses.map((e) => (e.handle === handle ? { ...e, ...changes } : e)),
    })),
  removeMyExpense: (handle) =>
    set((s) => ({ myExpenses: s.myExpenses.filter((e) => e.handle !== handle) })),
  setSupervisorInbox: (supervisorInbox) => set({ supervisorInbox }),
  setFinanceInbox: (financeInbox) => set({ financeInbox }),
  updateInboxExpense: (handle, changes) =>
    set((s) => ({
      supervisorInbox: s.supervisorInbox.map((e) => (e.handle === handle ? { ...e, ...changes } : e)),
      financeInbox: s.financeInbox.map((e) => (e.handle === handle ? { ...e, ...changes } : e)),
    })),
  removeFromInbox: (handle) =>
    set((s) => ({
      supervisorInbox: s.supervisorInbox.filter((e) => e.handle !== handle),
      financeInbox: s.financeInbox.filter((e) => e.handle !== handle),
    })),
  setSelectedExpense: (selectedExpense) => set({ selectedExpense }),
  setCategories: (categories) => set({ categories }),
  setMileageConfig: (mileageConfig) => set({ mileageConfig }),

  setListLoading: (listLoading) => set({ listLoading }),
  setInboxLoading: (inboxLoading) => set({ inboxLoading }),
  setDetailLoading: (detailLoading) => set({ detailLoading }),
  setSaving: (saving) => set({ saving }),
  setSubmitting: (submitting) => set({ submitting }),
  setApproving: (approving) => set({ approving }),

  setError: (error) => set({ error }),

  setScreenMode: (screenMode) => set({ screenMode }),
  setActiveDetailTab: (activeDetailTab) => set({ activeDetailTab }),
  setActiveSupervisorInboxTab: (activeSupervisorInboxTab) => set({ activeSupervisorInboxTab }),
  setActiveFinanceInboxTab: (activeFinanceInboxTab) => set({ activeFinanceInboxTab }),
  updateFormState: (changes) => set((s) => ({ formState: { ...s.formState, ...changes } })),
  resetFormState: () => set({ formState: { ...DEFAULT_EXPENSE_FORM } }),
  updateFinancePanel: (changes) => set((s) => ({ financePanel: { ...s.financePanel, ...changes } })),
  resetFinancePanel: () => set({ financePanel: { ...DEFAULT_FINANCE_PANEL } }),
  setDraftItems: (draftItems) => set({ draftItems }),
  addDraftItem: (item) => set((s) => ({ draftItems: [...s.draftItems, item] })),
  updateDraftItem: (handle, changes) => set((s) => ({
    draftItems: s.draftItems.map((i) => (i.handle === handle ? { ...i, ...changes } : i)),
  })),
  removeDraftItem: (handle) => set((s) => ({ draftItems: s.draftItems.filter((i) => i.handle !== handle) })),
  resetDraftItems: () => set({ draftItems: [] }),

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setDateRange: (dateRange) => set({ dateRange }),

  reset: () => set(defaultState),
}));
