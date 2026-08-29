'use client';

import { create } from "zustand";
import { parseCookies } from "nookies";
import { message } from "antd";
import { getOrganizationId } from "@/utils/cookieUtils";
import { HrmPayslipService } from "../services/payslipService";
import { downloadPayslipPdf, payslipPdfBlob } from "../utils/payslipPdf";
import { payslipFileName } from "../utils/payslipFormat";
import type { PayslipSnapshot } from "../types/domain.types";
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
  snapshot: PayslipSnapshot | null;
  snapshotLoading: boolean;
  snapshotError: string | null;
  pdfGenerating: boolean;
  bulkProgress: { done: number; total: number } | null;
  myPayslipList: PayslipListItem[];
  myPayslipRenderData: PayslipRenderData | null;
  myPayslipLoading: boolean;

  setMyPayslipYear: (year: number) => void;
  setMyPayslipMonth: (month: number) => void;
  loadMyPayslips: () => Promise<void>;
  loadMyPayslipData: (year: number, month: number) => Promise<void>;
  downloadMyPayslip: (year: number, month: number) => Promise<void>;
  loadMySnapshot: (year: number, month: number) => Promise<void>;

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

const getUser = () => parseCookies().user ?? "";
/**
 * The signed-in employee.
 *
 * This read `employeeId`, a cookie the app never sets — it sets `employeeCode` (7 other call sites
 * use that name). Every payslip request therefore went out with an empty employee id, and the
 * screen could not have worked for anyone. Falls back to the old name so nothing regresses if some
 * deployment does set it.
 */
const getEmployeeId = () => {
  const cookies = parseCookies();
  return cookies.employeeCode ?? cookies.employeeId ?? "";
};

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
        HrmPayslipService.getActiveTemplate(getOrganizationId()),
        HrmPayslipService.searchPayslips({
          organizationId: getOrganizationId(),
          payrollYear: year,
          payrollMonth: month,
          requestedBy: getUser(),
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
        organizationId: getOrganizationId(),
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
        organizationId: getOrganizationId(),
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
      // The server returns the frozen snapshot; the PDF is built here. be-spec §12.
      const snapshot = await HrmPayslipService.downloadMyPayslip({
        organizationId: getOrganizationId(),
        employeeId,
        payrollYear,
        payrollMonth,
        requestedBy: getUser(),
        accessType: "DOWNLOAD",
      });
      await downloadPayslipPdf(snapshot);
    } catch {
      message.error("Failed to download payslip");
    }
  },

  /**
   * HR bulk download. The server has no archive to send — it returns the snapshots and the browser
   * renders each PDF and zips them. be-spec §15.2.
   */
  downloadAllZip: async () => {
    const { generationYear, generationMonth, generationRunId } = get();
    set({ bulkProgress: { done: 0, total: 0 } });
    try {
      const snapshots = await HrmPayslipService.fetchRunSnapshots({
        organizationId: getOrganizationId(),
        payrollRunId: generationRunId ?? "",
      });
      if (snapshots.length === 0) {
        message.info("No payslips to download for this run");
        set({ bulkProgress: null });
        return;
      }
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (let i = 0; i < snapshots.length; i += 1) {
        const snap = snapshots[i];
        // eslint-disable-next-line no-await-in-loop
        const blob = await payslipPdfBlob(snap);
        zip.file(payslipFileName(snap.employeeId, snap.payrollYear, snap.payrollMonth), blob);
        set({ bulkProgress: { done: i + 1, total: snapshots.length } });
      }
      const archive = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(archive);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslips_${generationYear}_${String(generationMonth).padStart(2, "0")}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      message.success(`${snapshots.length} payslips downloaded`);
    } catch {
      message.error("Failed to download ZIP");
    } finally {
      set({ bulkProgress: null });
    }
  },

  myPayslipYear: currentYear,
  myPayslipMonth: currentMonth,
  snapshot: null,
  snapshotLoading: false,
  snapshotError: null,
  pdfGenerating: false,
  bulkProgress: null,
  myPayslipList: [],
  myPayslipRenderData: null,
  myPayslipLoading: false,

  setMyPayslipYear: (year) => set({ myPayslipYear: year }),
  setMyPayslipMonth: (month) => set({ myPayslipMonth: month }),

  loadMyPayslips: async () => {
    try {
      const data = await HrmPayslipService.getMyPayslips(getOrganizationId(), getEmployeeId());
      set({ myPayslipList: data });
    } catch {
      // silent — empty list shown
    }
  },

  loadMyPayslipData: async (_year, _month) => {
    // Note: getMyPayslipRenderData endpoint is not available in the backend API.
    // Payslip data is obtained via downloadMyPayslip (PDF) instead.
    set({ myPayslipLoading: false, myPayslipRenderData: null });
  },

  /** Loads the frozen snapshot for a month and renders the preview from it. */
  loadMySnapshot: async (year, month) => {
    set({ snapshotLoading: true, snapshotError: null });
    try {
      const snapshot = await HrmPayslipService.downloadMyPayslip({
        organizationId: getOrganizationId(),
        employeeId: getEmployeeId(),
        payrollYear: year,
        payrollMonth: month,
        requestedBy: getUser(),
        ipAddress: "",
        accessType: "VIEW",
      });
      set({ snapshot, snapshotLoading: false });
    } catch {
      set({
        snapshot: null,
        snapshotLoading: false,
        snapshotError: `We couldn't load your payslip for ${MONTHS[month - 1]}-${year}. `
          + "Try again, or contact HR if this continues.",
      });
    }
  },

  downloadMyPayslip: async (year, month) => {
    set({ pdfGenerating: true });
    try {
      // Render from the snapshot already on screen when we have it, so the file and the preview
      // are provably the same data. Only fetch when the user downloads without viewing.
      const existing = get().snapshot;
      const snapshot = existing && existing.payrollYear === year && existing.payrollMonth === month
        ? existing
        : await HrmPayslipService.downloadMyPayslip({
            organizationId: getOrganizationId(),
            employeeId: getEmployeeId(),
            payrollYear: year,
            payrollMonth: month,
            requestedBy: getUser(),
            ipAddress: "",
            accessType: "DOWNLOAD",
          });
      await downloadPayslipPdf(snapshot);
      message.success("Payslip downloaded.");
    } catch {
      message.error("Failed to download payslip");
    } finally {
      set({ pdfGenerating: false });
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
        organizationId: getOrganizationId(),
        payrollYear: repositoryYear ?? undefined,
        payrollMonth: repositoryMonth ?? undefined,
        employeeName: repositoryEmployeeSearch || undefined,
        requestedBy: getUser(),
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
      const data = await HrmPayslipService.getAllTemplates(getOrganizationId());
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
          handle: template.handle,
          organizationId: getOrganizationId(),
          templateName: template.templateName,
          companyName: template.companyName,
          companyAddress: template.companyAddress,
          footerNote: template.footerNote,
          signatureLabel: template.signatureLabel,
          earningsSectionLabel: template.earningsSectionLabel,
          deductionsSectionLabel: template.deductionsSectionLabel,
          updatedBy: getUser(),
        });
      } else {
        await HrmPayslipService.createTemplate({
          ...template,
          organizationId: getOrganizationId(),
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
        organizationId: getOrganizationId(),
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
