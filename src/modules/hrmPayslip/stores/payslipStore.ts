'use client';

import { create } from "zustand";
import { parseCookies } from "nookies";
import { message } from "antd";
import { HrmPayslipService } from "../services/payslipService";
import type {
  PayslipListItem,
  PayslipTemplate,
  PayslipRenderData,
  PayslipGenerationResult,
} from "../types/domain.types";
import type { PayslipTabKey } from "../types/ui.types";

interface PayslipState {
  activeTab: PayslipTabKey;
  setActiveTab: (tab: PayslipTabKey) => void;

  generationYear: number;
  generationMonth: number;
  generationRunId: string | null;
  generationRunStatus: string | null;
  generationRunEmployeeCount: number;
  activeTemplate: PayslipTemplate | null;
  generateScope: "all" | "selected";
  selectedEmployeeIds: string[];
  generating: boolean;
  generationResult: PayslipGenerationResult | null;
  distributionList: PayslipListItem[];

  setGenerationYear: (year: number) => void;
  setGenerationMonth: (month: number) => void;
  setGenerateScope: (scope: "all" | "selected") => void;
  setSelectedEmployeeIds: (ids: string[]) => void;
  loadGenerationContext: (year: number, month: number) => Promise<void>;
  runGeneration: () => Promise<void>;
  regenerateOne: (employeeId: string) => Promise<void>;
  downloadOne: (
    employeeId: string,
    payrollYear: number,
    payrollMonth: number
  ) => Promise<void>;
  downloadAllZip: () => Promise<void>;

  myPayslipYear: number;
  myPayslipMonth: number;
  myPayslipList: PayslipListItem[];
  myPayslipRenderData: PayslipRenderData | null;
  myPayslipLoading: boolean;

  setMyPayslipYear: (year: number) => void;
  setMyPayslipMonth: (month: number) => void;
  loadMyPayslips: () => Promise<void>;
  loadMyPayslipData: (year: number, month: number) => Promise<void>;
  downloadMyPayslip: (year: number, month: number) => Promise<void>;

  repositoryYear: number | null;
  repositoryMonth: number | null;
  repositoryEmployeeSearch: string;
  repositoryStatus: string;
  repositoryList: PayslipListItem[];
  repositoryLoading: boolean;

  setRepositoryFilters: (
    filters: Partial<{
      year: number | null;
      month: number | null;
      employeeSearch: string;
      status: string;
    }>
  ) => void;
  searchRepository: () => Promise<void>;

  templates: PayslipTemplate[];
  selectedTemplate: PayslipTemplate | null;
  templatesLoading: boolean;
  templatePreviewData: PayslipTemplate | null;

  fetchTemplates: () => Promise<void>;
  selectTemplate: (template: PayslipTemplate | null) => void;
  saveTemplate: (template: PayslipTemplate) => Promise<void>;
  setActiveTemplateFlag: (handle: string) => Promise<void>;
  setTemplatePreviewData: (template: PayslipTemplate | null) => void;

  reset: () => void;
}

const getSite = () => parseCookies().site ?? "";
const getUser = () => parseCookies().user ?? "";
const getEmployeeId = () => parseCookies().employeeId ?? "";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export const useHrmPayslipStore = create<PayslipState>((set, get) => ({
  activeTab: "myPayslips",
  setActiveTab: (tab) => set({ activeTab: tab }),

  generationYear: currentYear,
  generationMonth: currentMonth,
  generationRunId: null,
  generationRunStatus: null,
  generationRunEmployeeCount: 0,
  activeTemplate: null,
  generateScope: "all",
  selectedEmployeeIds: [],
  generating: false,
  generationResult: null,
  distributionList: [],

  setGenerationYear: (year) => set({ generationYear: year }),
  setGenerationMonth: (month) => set({ generationMonth: month }),
  setGenerateScope: (scope) => set({ generateScope: scope }),
  setSelectedEmployeeIds: (ids) => set({ selectedEmployeeIds: ids }),

  loadGenerationContext: async (year, month) => {
    try {
      const [template, payslips] = await Promise.all([
        HrmPayslipService.getActiveTemplate(getSite()),
        HrmPayslipService.searchPayslips({
          site: getSite(),
          payrollYear: year,
          payrollMonth: month,
        }),
      ]);
      set({
        activeTemplate: template,
        distributionList: payslips,
        generationYear: year,
        generationMonth: month,
      });
    } catch {
      message.error("Failed to load generation context");
    }
  },

  runGeneration: async () => {
    const { generationYear, generationMonth, generateScope, selectedEmployeeIds, generationRunId } =
      get();
    set({ generating: true, generationResult: null });
    try {
      const result = await HrmPayslipService.generatePayslips({
        site: getSite(),
        payrollRunId: generationRunId ?? "",
        payrollYear: generationYear,
        payrollMonth: generationMonth,
        generatedBy: getUser(),
        employeeIds: generateScope === "selected" ? selectedEmployeeIds : null,
      });
      set({ generationResult: result });
      await get().loadGenerationContext(generationYear, generationMonth);
      message.success(
        `Payslips generated: ${result.successCount} success, ${result.failureCount} failed`
      );
    } catch {
      message.error("Failed to generate payslips");
    } finally {
      set({ generating: false });
    }
  },

  regenerateOne: async (employeeId) => {
    const { generationYear, generationMonth } = get();
    try {
      await HrmPayslipService.regeneratePayslip({
        site: getSite(),
        employeeId,
        payrollYear: generationYear,
        payrollMonth: generationMonth,
        regeneratedBy: getUser(),
      });
      message.success("Payslip regenerated");
      await get().loadGenerationContext(generationYear, generationMonth);
    } catch {
      message.error("Failed to regenerate payslip");
    }
  },

  downloadOne: async (employeeId, payrollYear, payrollMonth) => {
    try {
      const blob = await HrmPayslipService.downloadPayslipByHr({
        site: getSite(),
        employeeId,
        payrollYear,
        payrollMonth,
        requestedBy: getUser(),
        accessType: "DOWNLOAD",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip_${employeeId}_${payrollYear}_${String(payrollMonth).padStart(2, "0")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error("Failed to download payslip");
    }
  },

  downloadAllZip: async () => {
    const { generationYear, generationMonth, generationRunId } = get();
    try {
      const blob = await HrmPayslipService.downloadAllPayslipsZip({
        site: getSite(),
        payrollRunId: generationRunId ?? "",
        payrollYear: generationYear,
        payrollMonth: generationMonth,
        requestedBy: getUser(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslips_${generationYear}_${String(generationMonth).padStart(2, "0")}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error("Failed to download ZIP");
    }
  },

  myPayslipYear: currentYear,
  myPayslipMonth: currentMonth,
  myPayslipList: [],
  myPayslipRenderData: null,
  myPayslipLoading: false,

  setMyPayslipYear: (year) => set({ myPayslipYear: year }),
  setMyPayslipMonth: (month) => set({ myPayslipMonth: month }),

  loadMyPayslips: async () => {
    try {
      const data = await HrmPayslipService.getMyPayslips(getSite(), getEmployeeId());
      set({ myPayslipList: data });
    } catch {
      // silent — empty list shown
    }
  },

  loadMyPayslipData: async (year, month) => {
    set({ myPayslipLoading: true, myPayslipRenderData: null });
    try {
      const data = await HrmPayslipService.getMyPayslipRenderData(
        getSite(),
        getEmployeeId(),
        year,
        month
      );
      set({ myPayslipRenderData: data });
    } catch {
      // payslip not generated for this period
    } finally {
      set({ myPayslipLoading: false });
    }
  },

  downloadMyPayslip: async (year, month) => {
    try {
      const blob = await HrmPayslipService.downloadMyPayslip({
        site: getSite(),
        employeeId: getEmployeeId(),
        payrollYear: year,
        payrollMonth: month,
        requestedBy: getUser(),
        ipAddress: "",
        accessType: "DOWNLOAD",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my_payslip_${year}_${String(month).padStart(2, "0")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error("Failed to download payslip");
    }
  },

  repositoryYear: currentYear,
  repositoryMonth: currentMonth,
  repositoryEmployeeSearch: "",
  repositoryStatus: "ALL",
  repositoryList: [],
  repositoryLoading: false,

  setRepositoryFilters: (filters) =>
    set((state) => ({
      repositoryYear: filters.year !== undefined ? filters.year : state.repositoryYear,
      repositoryMonth: filters.month !== undefined ? filters.month : state.repositoryMonth,
      repositoryEmployeeSearch:
        filters.employeeSearch !== undefined
          ? filters.employeeSearch
          : state.repositoryEmployeeSearch,
      repositoryStatus: filters.status !== undefined ? filters.status : state.repositoryStatus,
    })),

  searchRepository: async () => {
    const { repositoryYear, repositoryMonth, repositoryEmployeeSearch, repositoryStatus } = get();
    set({ repositoryLoading: true });
    try {
      const data = await HrmPayslipService.searchPayslips({
        site: getSite(),
        payrollYear: repositoryYear ?? undefined,
        payrollMonth: repositoryMonth ?? undefined,
        employeeSearch: repositoryEmployeeSearch || undefined,
        status: repositoryStatus !== "ALL" ? repositoryStatus : undefined,
      });
      set({ repositoryList: data });
    } catch {
      message.error("Failed to search payslips");
    } finally {
      set({ repositoryLoading: false });
    }
  },

  templates: [],
  selectedTemplate: null,
  templatesLoading: false,
  templatePreviewData: null,

  fetchTemplates: async () => {
    set({ templatesLoading: true });
    try {
      const data = await HrmPayslipService.getAllTemplates(getSite());
      set({ templates: data });
    } catch {
      message.error("Failed to load templates");
    } finally {
      set({ templatesLoading: false });
    }
  },

  selectTemplate: (template) => set({ selectedTemplate: template }),

  saveTemplate: async (template) => {
    try {
      if (template.handle) {
        await HrmPayslipService.updateTemplate({
          ...template,
          site: getSite(),
          modifiedBy: getUser(),
          createdBy: getUser(),
        });
      } else {
        await HrmPayslipService.createTemplate({
          ...template,
          site: getSite(),
          createdBy: getUser(),
        });
      }
      message.success("Template saved");
      await get().fetchTemplates();
    } catch {
      message.error("Failed to save template");
    }
  },

  setActiveTemplateFlag: async (handle) => {
    try {
      await HrmPayslipService.setActiveTemplate({
        site: getSite(),
        handle,
        updatedBy: getUser(),
      });
      message.success("Template activated");
      await get().fetchTemplates();
    } catch {
      message.error("Failed to activate template");
    }
  },

  setTemplatePreviewData: (template) => set({ templatePreviewData: template }),

  reset: () =>
    set({
      activeTab: "myPayslips",
      generationResult: null,
      distributionList: [],
      selectedEmployeeIds: [],
      myPayslipList: [],
      myPayslipRenderData: null,
      repositoryList: [],
      templates: [],
      selectedTemplate: null,
    }),
}));
