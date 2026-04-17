import { create } from 'zustand';
import { parseCookies } from 'nookies';
import { message } from 'antd';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmPayrollService } from '../services/payrollService';
import type {
  PayrollRunSummary,
  PayrollEntry,
  TaxConfiguration,
  StatutoryConfig,
} from '../types/domain.types';
import type { PayrollTabKey } from '../types/ui.types';

export type { PayrollTabKey };
export type WizardStep = 0 | 1 | 2 | 3 | 4 | 5;

export interface PayrollAdjustmentDraft {
  employeeId: string;
  employeeName: string;
  adjustmentType: string;
  description: string;
  amount: number;
}

const getUser = () => parseCookies().userId ?? parseCookies().user ?? '';

interface PayrollState {
  activeTab: PayrollTabKey;
  setActiveTab: (tab: PayrollTabKey) => void;

  // Dashboard
  allRuns: PayrollRunSummary[];
  currentRun: PayrollRunSummary | null;
  dashboardLoading: boolean;
  fetchAllRuns: () => Promise<void>;
  fetchCurrentRun: (runId: string) => Promise<void>;

  // Wizard
  wizardStep: WizardStep;
  wizardRunId: string | null;
  wizardRunSummary: PayrollRunSummary | null;
  includedEmployeeIds: string[];
  lopInputs: Record<string, number>;
  adjustments: PayrollAdjustmentDraft[];
  computationProgress: number;
  processedCount: number;
  errorCount: number;
  remainingCount: number;

  setWizardStep: (step: WizardStep) => void;
  setWizardRunId: (runId: string | null) => void;
  setIncludedEmployeeIds: (ids: string[]) => void;
  updateLopInput: (employeeId: string, days: number) => void;
  addAdjustment: (adj: PayrollAdjustmentDraft) => void;
  removeAdjustment: (idx: number) => void;
  createPayrollRun: (year: number, month: number, payDate: string) => Promise<void>;
  saveLopInputs: () => Promise<void>;
  saveAdjustments: () => Promise<void>;
  startComputation: () => Promise<void>;
  approveRun: (remarks: string) => Promise<void>;
  finalizeRun: () => Promise<void>;
  publishRun: () => Promise<void>;

  // Review
  reviewRunId: string | null;
  reviewEntries: PayrollEntry[];
  reviewLoading: boolean;
  selectedEntry: PayrollEntry | null;
  setReviewRunId: (runId: string | null) => void;
  fetchReviewEntries: (runId: string) => Promise<void>;
  selectEntry: (entry: PayrollEntry | null) => void;

  // Tax Config
  taxConfig: TaxConfiguration | null;
  pfConfig: StatutoryConfig | null;
  esiConfig: StatutoryConfig | null;
  ptConfig: StatutoryConfig | null;
  taxConfigLoading: boolean;
  fetchTaxConfig: (financialYearStart: number, regime: 'OLD' | 'NEW') => Promise<void>;
  fetchStatutoryConfig: (configType: 'PF' | 'ESI' | 'PT') => Promise<void>;
  saveTaxConfig: (config: TaxConfiguration) => Promise<void>;
  saveStatutoryConfig: (config: StatutoryConfig) => Promise<void>;

  reset: () => void;
}

export const useHrmPayrollStore = create<PayrollState>((set, get) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Dashboard
  allRuns: [],
  currentRun: null,
  dashboardLoading: false,

  fetchAllRuns: async () => {
    set({ dashboardLoading: true });
    try {
      const data = await HrmPayrollService.fetchAllRuns(getOrganizationId());
      set({ allRuns: data, currentRun: data[0] ?? null });
    } catch {
      // silently handle — component shows empty state
    } finally {
      set({ dashboardLoading: false });
    }
  },

  fetchCurrentRun: async (runId) => {
    try {
      const data = await HrmPayrollService.getPayrollRun(getOrganizationId(), runId);
      set({ currentRun: data });
    } catch {
      // ignore
    }
  },

  // Wizard
  wizardStep: 0,
  wizardRunId: null,
  wizardRunSummary: null,
  includedEmployeeIds: [],
  lopInputs: {},
  adjustments: [],
  computationProgress: 0,
  processedCount: 0,
  errorCount: 0,
  remainingCount: 0,

  setWizardStep: (step) => set({ wizardStep: step }),
  setWizardRunId: (runId) => set({ wizardRunId: runId }),
  setIncludedEmployeeIds: (ids) => set({ includedEmployeeIds: ids }),

  updateLopInput: (employeeId, days) =>
    set((state) => ({ lopInputs: { ...state.lopInputs, [employeeId]: days } })),

  addAdjustment: (adj) =>
    set((state) => ({ adjustments: [...state.adjustments, adj] })),

  removeAdjustment: (idx) =>
    set((state) => ({ adjustments: state.adjustments.filter((_, i) => i !== idx) })),

  createPayrollRun: async (year, month, payDate) => {
    const summary = await HrmPayrollService.createPayrollRun({
      organizationId: getOrganizationId(),
      company: getOrganizationId(),
      payrollYear: year,
      payrollMonth: month,
      payDate,
      createdBy: getUser(),
    });
    set({ wizardRunId: summary.runId, wizardRunSummary: summary });
    message.success(`Payroll run ${summary.runId} created`);
  },

  saveLopInputs: async () => {
    const { wizardRunId, lopInputs } = get();
    if (!wizardRunId) return;
    for (const [employeeId, lopDays] of Object.entries(lopInputs)) {
      await HrmPayrollService.updateLop({
        organizationId: getOrganizationId(),
        payrollRunId: wizardRunId,
        employeeId,
        lopDays,
        updatedBy: getUser(),
      });
    }
  },

  saveAdjustments: async () => {
    const { wizardRunId, adjustments } = get();
    if (!wizardRunId) return;
    for (const adj of adjustments) {
      await HrmPayrollService.addAdjustment({
        organizationId: getOrganizationId(),
        payrollRunId: wizardRunId,
        employeeId: adj.employeeId,
        adjustmentType: adj.adjustmentType as import('../types/api.types').AdjustmentType,
        description: adj.description,
        amount: adj.amount,
        addedBy: getUser(),
      });
    }
  },

  startComputation: async () => {
    const { wizardRunId } = get();
    if (!wizardRunId) return;
    set({ computationProgress: 0, processedCount: 0, errorCount: 0 });
    const summary = await HrmPayrollService.runCalculation({
      organizationId: getOrganizationId(),
      payrollRunId: wizardRunId,
      performedBy: getUser(),
    });
    set({
      wizardRunSummary: summary,
      computationProgress: 100,
      processedCount: summary.processedEmployees,
      errorCount: summary.errorEmployees,
      remainingCount: 0,
    });
  },

  approveRun: async (remarks) => {
    const { wizardRunId } = get();
    if (!wizardRunId) return;
    const updated = await HrmPayrollService.approvePayrollRun({
      organizationId: getOrganizationId(),
      payrollRunId: wizardRunId,
      action: 'APPROVE',
      performedBy: getUser(),
      remarks,
    });
    set({ wizardRunSummary: updated });
    message.success('Payroll approved');
  },

  finalizeRun: async () => {
    const { wizardRunId } = get();
    if (!wizardRunId) return;
    const updated = await HrmPayrollService.finalizePayrollRun(getOrganizationId(), wizardRunId, getUser());
    set({ wizardRunSummary: updated });
    message.success('Payroll finalized and locked');
  },

  publishRun: async () => {
    const { wizardRunId } = get();
    if (!wizardRunId) return;
    const updated = await HrmPayrollService.publishPayrollRun(getOrganizationId(), wizardRunId, getUser());
    set({ wizardRunSummary: updated });
    message.success('Payroll published to employees');
    await get().fetchAllRuns();
  },

  // Review
  reviewRunId: null,
  reviewEntries: [],
  reviewLoading: false,
  selectedEntry: null,

  setReviewRunId: (runId) => set({ reviewRunId: runId }),

  fetchReviewEntries: async (runId) => {
    set({ reviewLoading: true });
    try {
      const data = await HrmPayrollService.getPayrollEntries(getOrganizationId(), runId);
      set({ reviewEntries: data });
    } catch {
      // handled by component
    } finally {
      set({ reviewLoading: false });
    }
  },

  selectEntry: (entry) => set({ selectedEntry: entry }),

  // Tax Config
  taxConfig: null,
  pfConfig: null,
  esiConfig: null,
  ptConfig: null,
  taxConfigLoading: false,

  fetchTaxConfig: async (financialYearStart, regime) => {
    set({ taxConfigLoading: true });
    try {
      const data = await HrmPayrollService.getTaxConfiguration(getOrganizationId(), financialYearStart, regime);
      set({ taxConfig: data });
    } finally {
      set({ taxConfigLoading: false });
    }
  },

  fetchStatutoryConfig: async (configType) => {
    const data = await HrmPayrollService.getStatutoryConfig(getOrganizationId(), configType);
    if (configType === 'PF') set({ pfConfig: data });
    else if (configType === 'ESI') set({ esiConfig: data });
    else set({ ptConfig: data });
  },

  saveTaxConfig: async (config) => {
    const updated = await HrmPayrollService.saveTaxConfiguration(config);
    set({ taxConfig: updated });
    message.success('Tax configuration saved');
  },

  saveStatutoryConfig: async (config) => {
    const updated = await HrmPayrollService.saveStatutoryConfig(config);
    if (config.configType === 'PF') set({ pfConfig: updated });
    else if (config.configType === 'ESI') set({ esiConfig: updated });
    else set({ ptConfig: updated });
    message.success('Statutory configuration saved');
  },

  reset: () =>
    set({
      activeTab: 'dashboard',
      allRuns: [],
      currentRun: null,
      wizardStep: 0,
      wizardRunId: null,
      wizardRunSummary: null,
      includedEmployeeIds: [],
      lopInputs: {},
      adjustments: [],
      computationProgress: 0,
      reviewRunId: null,
      reviewEntries: [],
      selectedEntry: null,
      taxConfig: null,
      pfConfig: null,
      esiConfig: null,
      ptConfig: null,
    }),
}));
