'use client';

import { create } from "zustand";
import { parseCookies } from "nookies";
import { message } from "antd";
import { getOrganizationId } from "@/utils/cookieUtils";
import { HrmPayslipService } from "../services/payslipService";
import { buildPayslipPassword, downloadPayslipPdf, payslipPdfBlob } from "../utils/payslipPdf";
import { hrDownloadRoute, payslipFileName } from "../utils/payslipFormat";
import { chunkFiles, splitAtFailedChunk, summarise } from "../utils/uploadHelpers";
import { saveBlob } from "../utils/saveBlob";
import type { PayslipSnapshot, PayslipUploadBatch } from "../types/domain.types";
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
  /**
   * HR download of one listed payslip (Repository and the Generate panel). Routes by source:
   * UPLOADED -> downloadUploadedOne, otherwise -> downloadGeneratedByHr. Never self-service.
   */
  downloadListedPayslip: (record: PayslipListItem) => Promise<void>;
  /** HR download of a GENERATED payslip by its handle: renders the PDF from the HR snapshot. */
  downloadGeneratedByHr: (handle: string) => Promise<void>;
  /** HR download of an UPLOADED payslip by its handle (backend DOWNLOAD_ANY). */
  downloadUploadedOne: (handle: string, fileName: string | null) => Promise<void>;
  downloadAllZip: () => Promise<void>;

  myPayslipYear: number;
  myPayslipMonth: number;
  snapshot: PayslipSnapshot | null;
  snapshotLoading: boolean;
  snapshotError: string | null;
  pdfGenerating: boolean;
  bulkProgress: { done: number; total: number } | null;
  myPayslipList: PayslipListItem[];
  /**
   * True once `loadMyPayslips` has completed (success or failure) at least once. The snapshot
   * effect must wait for this before it can trust `myPayslipList` to say whether a period is
   * UPLOADED — see `loadMySnapshot` and `shouldLoadMySnapshot` (fix round 1, finding 1).
   */
  myPayslipListLoaded: boolean;
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

  uploadBatch: PayslipUploadBatch | null;
  uploading: boolean;
  uploadProgress: { done: number; total: number };
  batchHistory: PayslipUploadBatch[];
  batchHistoryLoading: boolean;

  /**
   * The batch a failed upload left part-way through. A retry appends to it rather than starting a
   * second batch for the same month; cleared once an upload completes or HR starts another.
   */
  pendingBatchHandle: string | null;
  /**
   * Uploads in chunks. Resolves with the files that did NOT reach the server — empty on success —
   * so the panel can keep them selected for a retry instead of silently dropping them.
   */
  uploadFiles: (files: File[]) => Promise<{ unsent: File[] }>;
  loadBatchHistory: () => Promise<void>;
  openBatch: (handle: string) => Promise<void>;
  clearUploadBatch: () => void;

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

/**
 * Finds the employee's own list row for a period, so the snapshot and download paths can branch
 * on `source` without each re-deriving the lookup. Not part of the store's public state.
 */
const myRow = (get: () => PayslipState, year: number, month: number) =>
  get().myPayslipList.find((p) => p.payrollYear === year && p.payrollMonth === month);

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

  downloadListedPayslip: async (record) => {
    // One routing rule for every HR list: the self-service /downloadMyPayslip would refuse another
    // employee (403) and has no snapshot for an uploaded row (PAYSLIP_020).
    const route = hrDownloadRoute(record);
    if (route.kind === "uploaded") {
      await get().downloadUploadedOne(route.handle, route.fileName);
    } else {
      await get().downloadGeneratedByHr(route.handle);
    }
  },

  downloadGeneratedByHr: async (handle) => {
    try {
      // /downloadMyPayslip is self-service only, so HR must use the by-handle endpoint. It returns
      // the same frozen snapshot, and the PDF and its password are built exactly as in downloadMyPayslip.
      const snapshot = await HrmPayslipService.downloadPayslipByHr({
        organizationId: getOrganizationId(),
        handle,
        requestedBy: getUser(),
      });
      await downloadPayslipPdf(snapshot, buildPayslipPassword(snapshot));
    } catch {
      message.error("Failed to download payslip");
    }
  },

  downloadUploadedOne: async (handle, fileName) => {
    try {
      // An uploaded payslip is a stored PDF with no snapshot; fetch its bytes by handle. The backend
      // checks payslip_download|VIEW on this path (R7).
      const blob = await HrmPayslipService.downloadUploadedPayslip({
        organizationId: getOrganizationId(),
        handle,
        requestedBy: getEmployeeId(),
      });
      const row = get().repositoryList.find((r) => r.handle === handle);
      saveBlob(
        blob,
        fileName
          ?? (row ? payslipFileName(row.employeeId, row.payrollYear, row.payrollMonth) : `payslip-${handle}.pdf`)
      );
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
        const blob = await payslipPdfBlob(snap, buildPayslipPassword(snap));
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
  myPayslipListLoaded: false,
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
    } finally {
      set({ myPayslipListLoaded: true });
    }
  },

  loadMyPayslipData: async (_year, _month) => {
    // Note: getMyPayslipRenderData endpoint is not available in the backend API.
    // Payslip data is obtained via downloadMyPayslip (PDF) instead.
    set({ myPayslipLoading: false, myPayslipRenderData: null });
  },

  /** Loads the frozen snapshot for a month and renders the preview from it. */
  loadMySnapshot: async (year, month) => {
    // An uploaded payslip is a real PDF in storage, not a rendered snapshot — there is nothing
    // for this endpoint to return, and calling it throws (PAYSLIP_020).
    if (myRow(get, year, month)?.source === "UPLOADED") {
      set({ snapshot: null, snapshotLoading: false, snapshotError: null });
      return;
    }
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
      const row = myRow(get, year, month);
      if (row?.source === "UPLOADED") {
        // An uploaded payslip is a real PDF in storage; fetch its bytes and hand them to the
        // browser. There is no snapshot to render, and the existing password-protecting
        // generated-download path below does not apply.
        const blob = await HrmPayslipService.downloadUploadedPayslip({
          organizationId: getOrganizationId(),
          employeeId: getEmployeeId(),
          payrollYear: year,
          payrollMonth: month,
        });
        saveBlob(blob, row.fileName ?? payslipFileName(getEmployeeId(), year, month));
        return;
      }
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
      await downloadPayslipPdf(snapshot, buildPayslipPassword(snapshot));
      message.success(buildPayslipPassword(snapshot)
        ? "Payslip downloaded. Open it with the password shown on screen."
        : "Payslip downloaded.");
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

  uploadBatch: null,
  uploading: false,
  uploadProgress: { done: 0, total: 0 },
  batchHistory: [],
  batchHistoryLoading: false,

  pendingBatchHandle: null,

  clearUploadBatch: () =>
    set({ uploadBatch: null, pendingBatchHandle: null, uploadProgress: { done: 0, total: 0 } }),

  uploadFiles: async (files) => {
    const organizationId = getOrganizationId();
    const uploadedBy = getEmployeeId();
    const chunks = chunkFiles(files);
    set({ uploading: true, uploadProgress: { done: 0, total: files.length } });
    // A retry after a failed chunk appends to the batch that failure left behind.
    let handle: string | undefined = get().pendingBatchHandle ?? undefined;
    let batch: PayslipUploadBatch | null = null;
    let sentCount = 0;
    let index = 0;
    try {
      for (; index < chunks.length; index += 1) {
        // Sequential, not parallel: each call appends to the same batch document, and
        // concurrent appends would race the read-modify-write on items[].
        // eslint-disable-next-line no-await-in-loop
        batch = await HrmPayslipService.uploadPayslipBatch({
          organizationId,
          uploadedBy,
          batchHandle: handle,
          files: chunks[index],
        });
        handle = batch?.handle ?? handle;
        sentCount += chunks[index].length;
        set({
          uploadBatch: batch,
          pendingBatchHandle: handle ?? null,
          uploadProgress: { done: sentCount, total: files.length },
        });
      }
      set({ pendingBatchHandle: null });
      const summary = batch ? summarise(batch) : null;
      if (summary) {
        message.success(`${summary.stored} stored, ${summary.skipped} need attention`);
      }
      return { unsent: [] };
    } catch (err) {
      // Chunk `index` failed; it and every later chunk never reached the server. Report them
      // rather than dropping them, and keep the handle so the retry lands in the same batch.
      const { unsent } = splitAtFailedChunk(chunks, index);
      set({ pendingBatchHandle: handle ?? null, uploadProgress: { done: 0, total: 0 } });
      const serverMsg = (err as { response?: { data?: { message_details?: { msg?: string } } } })
        ?.response?.data?.message_details?.msg;
      message.error(serverMsg ? `Payslip upload failed: ${serverMsg}` : "Payslip upload failed");
      return { unsent };
    } finally {
      set({ uploading: false });
    }
  },

  loadBatchHistory: async () => {
    set({ batchHistoryLoading: true });
    try {
      const data = await HrmPayslipService.getUploadBatches(getOrganizationId(), getEmployeeId());
      set({ batchHistory: data });
    } catch {
      message.error("Could not load upload history");
    } finally {
      set({ batchHistoryLoading: false });
    }
  },

  // R8: opening a batch from history only loads it into `uploadBatch` — it never switches tabs.
  // The panel that shows history renders the summary inline alongside its table.
  openBatch: async (handle) => {
    try {
      const batch = await HrmPayslipService.getUploadBatch({
        organizationId: getOrganizationId(),
        requestedBy: getEmployeeId(),
        handle,
      });
      set({ uploadBatch: batch });
    } catch {
      message.error("Could not open that batch");
    }
  },

  reset: () =>
    set({
      activeTab: "myPayslips",
      generationResult: null,
      distributionList: [],
      selectedEmployeeIds: [],
      myPayslipList: [],
      myPayslipListLoaded: false,
      myPayslipRenderData: null,
      repositoryList: [],
      templates: [],
      selectedTemplate: null,
      uploadBatch: null,
      pendingBatchHandle: null,
      uploading: false,
      uploadProgress: { done: 0, total: 0 },
      batchHistory: [],
      batchHistoryLoading: false,
    }),
}));
