import api from "@/services/api";
import { base64ToBlob, detectMimeFromBase64 } from "../utils/base64Utils";
import type {
  ExpenseListRequest,
  ExpenseApproverInboxRequest,
  GetExpenseByHandleRequest,
  ExpenseCreatePayload,
  ExpenseUpdatePayload,
  ExpenseSubmitRequest,
  ExpenseApprovalPayload,
  ExpenseRejectPayload,
  ExpenseFinanceSanctionPayload,
  ExpensePaymentPayload,
  ExpenseCancelRequest,
  ExpenseRecallRequest,
  ExpenseDeleteRequest,
  MileageCalculateRequest,
  MileageCalculateResponse,
  SiteRequest,
  MarkOriginalsReceivedRequest,
  GetUnsettledAdvancesRequest,
  UnsettledAdvance,
  ExpenseCategorySavePayload,
  ExpenseCategoryDeleteRequest,
  ExpenseExportRequest,
  ReceiptUploadResponse,
} from "../types/api.types";
import type {
  ExpenseReport,
  ExpenseCategory,
  MileageConfig,
  EmployeeBankDetails,
} from "../types/domain.types";

export class HrmExpenseService {
  private static readonly BASE = "/hrm-service/expense";

  // ── My Expenses ──────────────────────────────────────────────────────
  static async getMyExpenses(payload: ExpenseListRequest): Promise<ExpenseReport[]> {
    const { data } = await api.post(`${this.BASE}/my-expenses`, payload);
    return data;
  }

  static async getExpenseByHandle(payload: GetExpenseByHandleRequest): Promise<ExpenseReport> {
    const { data } = await api.post(`${this.BASE}/get`, payload);
    return data;
  }

  // ── CRUD ─────────────────────────────────────────────────────────────
  static async createDraft(payload: ExpenseCreatePayload): Promise<ExpenseReport> {
    const { data } = await api.post(`${this.BASE}/create`, payload);
    return data;
  }

  static async updateDraft(payload: ExpenseUpdatePayload): Promise<ExpenseReport> {
    const { data } = await api.post(`${this.BASE}/update`, payload);
    return data;
  }

  static async submitExpense(payload: ExpenseSubmitRequest): Promise<ExpenseReport> {
    const { data } = await api.post(`${this.BASE}/submit`, payload);
    return data;
  }

  static async deleteExpense(payload: ExpenseDeleteRequest): Promise<void> {
    await api.post(`${this.BASE}/delete`, payload);
  }

  // ── Approval ─────────────────────────────────────────────────────────
  static async getSupervisorInbox(payload: ExpenseApproverInboxRequest): Promise<ExpenseReport[]> {
    const { data } = await api.post(`${this.BASE}/supervisor-inbox`, payload);
    return data;
  }

  /**
   * Returns ALL expenses owned by the supervisor's reportees, in any status.
   * Used by the "Team History" tab. Backend endpoint: see
   * src/docs/expense/backend_changes_prompt.md §1.
   */
  static async getSupervisorHistory(payload: ExpenseApproverInboxRequest): Promise<ExpenseReport[]> {
    const { data } = await api.post(`${this.BASE}/supervisor-history`, payload);
    return data;
  }

  static async getFinanceInbox(payload: SiteRequest): Promise<ExpenseReport[]> {
    const { data } = await api.post(`${this.BASE}/finance-inbox`, payload);
    return data;
  }

  static async supervisorApprove(payload: ExpenseApprovalPayload): Promise<ExpenseReport> {
    const { data } = await api.post(`${this.BASE}/supervisor/approve`, payload);
    return data;
  }

  static async supervisorReject(payload: ExpenseRejectPayload): Promise<ExpenseReport> {
    const { data } = await api.post(`${this.BASE}/supervisor/reject`, payload);
    return data;
  }

  static async financeSanction(payload: ExpenseFinanceSanctionPayload): Promise<ExpenseReport> {
    const { data } = await api.post(`${this.BASE}/finance/approve`, payload);
    return data;
  }

  static async financeReject(payload: ExpenseRejectPayload): Promise<ExpenseReport> {
    const { data } = await api.post(`${this.BASE}/finance/reject`, payload);
    return data;
  }

  static async markAsPaid(payload: ExpensePaymentPayload): Promise<ExpenseReport> {
    const { data } = await api.post(`${this.BASE}/finance/payment`, payload);
    return data;
  }

  // ── Cancel / Recall ──────────────────────────────────────────────────
  static async cancelExpense(payload: ExpenseCancelRequest): Promise<ExpenseReport> {
    const { data } = await api.post(`${this.BASE}/cancel`, payload);
    return data;
  }

  static async recallExpense(payload: ExpenseRecallRequest): Promise<ExpenseReport> {
    const { data } = await api.post(`${this.BASE}/recall`, payload);
    return data;
  }

  // ── Attachments ──────────────────────────────────────────────────────
  // Receipts are line-bound only. lineIndex is the 0-based index of the
  // target line item. Expense-level attachments (lineIndex = -1) are no
  // longer supported — see src/docs/expense/receipts-redesign-prompt.md.
  //
  // The form ships every plausible field name BE handlers have used so a
  // missing required field never blows up as HRM_INTERNAL / 500: parent
  // expense under three aliases (expenseId / expenseHandle /
  // expenseRequestHandle), line under two (lineIndex + lineHandle when
  // known), and the actor as `uploadedBy` (composite "EMP-x - Name" per
  // the project identity contract).
  static async uploadAttachment(
    expenseId: string,
    file: File,
    organizationId: string,
    lineIndex: number,
    opts?: { lineHandle?: string; uploadedBy?: string },
  ): Promise<ReceiptUploadResponse> {
    const form = new FormData();
    form.append("file", file);
    form.append("expenseId", expenseId);
    form.append("expenseHandle", expenseId);
    form.append("expenseRequestHandle", expenseId);
    form.append("organizationId", organizationId);
    form.append("lineIndex", String(lineIndex));
    if (opts?.lineHandle) {
      form.append("lineHandle", opts.lineHandle);
      form.append("expenseItemHandle", opts.lineHandle);
    }
    if (opts?.uploadedBy) {
      form.append("uploadedBy", opts.uploadedBy);
      form.append("createdBy", opts.uploadedBy);
    }
    // Do NOT set Content-Type here. The browser/axios auto-sets it to
    // `multipart/form-data; boundary=----WebKitFormBoundaryXXX` when
    // given a FormData body. Setting it manually without the boundary
    // causes the backend's multipart parser to fail.
    const { data } = await api.post(`${this.BASE}/receipt/upload`, form);
    return data;
  }

  static async deleteReceipt(payload: {
    organizationId: string;
    expenseId: string;
    lineIndex: number;
    attachmentId: string;
  }): Promise<void> {
    const body = {
      ...payload,
      attachmentId: this.normalizeAttachmentRef(payload.attachmentId),
    };
    await api.post(`${this.BASE}/receipt/delete`, body);
  }

  /**
   * Fetch a receipt as a binary blob. The caller wraps the blob in a
   * URL via URL.createObjectURL() and opens / displays it.
   *
   * BE resolves the file by (expenseId, lineIndex, attachmentRef) — same
   * tuple as /receipt/delete. Sending only attachmentRef caused 500s
   * because the receipt store is keyed under the parent expense + line.
   *
   * BE has returned attachmentRefs in two shapes historically:
   *   - bare UUID:  "d8ce2878-ac57-4df5-bf7c-eef8b0106795"
   *   - full path:  "/app/v1/hrm-service/expense/receipt/<UUID>/download"
   * The full-path variant 500s server-side (HRM_INTERNAL) because the
   * retrieval lookup expects a bare id. Normalize before sending so the
   * preview/download paths work regardless of which shape BE stored.
   */
  private static normalizeAttachmentRef(raw: string): string {
    if (!raw) return raw;
    const match = raw.match(/\/receipt\/([^/?#]+?)(?:\/download)?$/i);
    return match?.[1] ?? raw;
  }

  /**
   * Pull the base64 payload out of the download response. The BE has
   * shipped it under a few different keys (`base64Data`, `base64`,
   * `fileContent`, `content`) and — in at least one observed response —
   * under a malformed empty key (`"": "<base64>"`). Probe each so a
   * key-name change on the BE doesn't silently break the preview.
   */
  private static pickBase64(obj: Record<string, any>): string | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    const candidates = [
      obj.base64Data,
      obj.base64,
      obj.fileContent,
      obj.content,
      obj.data,
      obj[''], // BE has serialized the base64 under an empty key
    ];
    return candidates.find(
      (v) => typeof v === 'string' && v.length > 0,
    ) as string | undefined;
  }

  static async downloadReceipt(payload: {
    organizationId: string;
    expenseId?: string;
    lineIndex?: number;
    attachmentRef: string;
    attachmentId?: string;
  }): Promise<{ blob: Blob; fileName?: string }> {
    const normalizedRef = this.normalizeAttachmentRef(payload.attachmentRef);
    // Mirror delete's field name as a safety net — different BE handlers
    // have used `attachmentRef` and `attachmentId` interchangeably.
    const body = {
      ...payload,
      attachmentRef: normalizedRef,
      attachmentId:
        this.normalizeAttachmentRef(payload.attachmentId ?? '') || normalizedRef,
    };

    try {
      // JSON response (current API format). NOTE: the global response
      // interceptor (services/api.ts) already unwraps the BE envelope
      // `{ handle, message_details, response }` down to its inner
      // `response` object for /hrm-service/ URLs — so `response.data`
      // here is ALREADY `{ attachmentId, fileName, contentType,
      // base64Data, ... }`, NOT the envelope. Guard for both shapes in
      // case the interceptor contract changes.
      const response = await api.post(`${this.BASE}/receipt/download`, body);
      const data = response.data;
      const inner =
        data && typeof data === 'object' && 'response' in data && data.response
          ? data.response
          : data;

      if (inner && typeof inner === 'object' && !(inner instanceof Blob)) {
        const base64Data = this.pickBase64(inner);
        if (base64Data) {
          const contentType: string | undefined = inner.contentType;
          const fileName: string | undefined = inner.fileName;

          // BE sometimes returns no contentType, or a generic
          // octet-stream. The browser then renders image bytes as text
          // inside an iframe — the original "image not opening" bug.
          // Sniff the real MIME from base64 magic bytes when the BE
          // value is missing or unhelpful.
          const sniffed = detectMimeFromBase64(base64Data);
          const effectiveType =
            !contentType || contentType === 'application/octet-stream'
              ? sniffed ?? contentType ?? 'application/octet-stream'
              : contentType;

          try {
            return { blob: base64ToBlob(base64Data, effectiveType), fileName };
          } catch (base64Error) {
            console.error('Base64 conversion error:', base64Error);
            throw new Error('Failed to convert base64 data to blob');
          }
        }
      }

      // If it's already a blob, return as is
      if (data instanceof Blob) {
        return { blob: data };
      }

      // If it's binary data as ArrayBuffer
      if (data instanceof ArrayBuffer || data?.constructor === ArrayBuffer) {
        return { blob: new Blob([data]) };
      }

      // Fallback: try to get as blob (old API format)
      const blobResponse = await api.post(`${this.BASE}/receipt/download`, body, {
        responseType: "blob",
      });
      return { blob: blobResponse.data };

    } catch (error) {
      console.error('Download receipt error:', error);
      console.error('Request payload:', body);

      // Last resort: try the old blob method
      try {
        const blobResponse = await api.post(`${this.BASE}/receipt/download`, body, {
          responseType: "blob",
        });
        return { blob: blobResponse.data };
      } catch (blobError) {
        console.error('Blob download also failed:', blobError);
        throw error; // throw the original error
      }
    }
  }

  // ── Config ────────────────────────────────────────────────────────────
  static async getCategories(payload: SiteRequest): Promise<ExpenseCategory[]> {
    const { data } = await api.post(`${this.BASE}/category/list`, payload);
    return data;
  }

  static async saveCategory(payload: ExpenseCategorySavePayload): Promise<ExpenseCategory> {
    const { data } = await api.post(`${this.BASE}/category/save`, payload);
    return data;
  }

  static async deleteCategory(payload: ExpenseCategoryDeleteRequest): Promise<void> {
    await api.post(`${this.BASE}/category/delete`, payload);
  }

  static async getMileageConfig(payload: SiteRequest): Promise<MileageConfig> {
    const { data } = await api.post(`${this.BASE}/mileage-config/retrieve`, payload);
    return data;
  }

  /**
   * Petrol-price-driven rate config (new flow). Falls back to a sensible default
   * if the backend has no row yet. See src/docs/expense/backend_changes_prompt.md §2.
   */
  static async getMileageRateConfig(
    payload: { organizationId: string },
  ): Promise<import("../types/domain.types").MileageRateConfig> {
    const { data } = await api.post(`${this.BASE}/mileage-config/get`, payload);
    return data;
  }

  static async getEmployeeBankDetails(payload: { organizationId: string; employeeId: string }): Promise<EmployeeBankDetails> {
    const { data } = await api.post(`${this.BASE}/employee-bank-details`, payload);
    return data;
  }

  // ── Mileage ────────────────────────────────────────────────────────
  static async calculateMileage(payload: MileageCalculateRequest): Promise<MileageCalculateResponse> {
    const { data } = await api.post(`${this.BASE}/mileage/calculate`, payload);
    return data;
  }

  // ── Export ────────────────────────────────────────────────────────────
  static async exportExpenses(payload: ExpenseExportRequest): Promise<Blob> {
    const response = await api.post(`${this.BASE}/export`, payload, {
      responseType: "blob",
    });
    return response.data;
  }

  // ── Originals Received ──────────────────────────────────────────────
  static async markOriginalsReceived(payload: MarkOriginalsReceivedRequest): Promise<ExpenseReport> {
    const { data } = await api.post(`${this.BASE}/finance/originals-received`, payload);
    return data;
  }

  // ── Unsettled Advances ──────────────────────────────────────────────
  static async getUnsettledAdvances(payload: GetUnsettledAdvancesRequest): Promise<UnsettledAdvance[]> {
    const { data } = await api.post(`${this.BASE}/advances/unsettled`, payload);
    return Array.isArray(data) ? data : [];
  }

  // ── List (all expenses) ────────────────────────────────────────────
  static async listExpenses(payload: ExpenseListRequest): Promise<ExpenseReport[]> {
    const { data } = await api.post(`${this.BASE}/list`, payload);
    return data;
  }

  // ── Reports ────────────────────────────────────────────────────────
  static async getOutOfPolicyReport(payload: SiteRequest & Record<string, unknown>): Promise<ExpenseReport[]> {
    const { data } = await api.post(`${this.BASE}/report/out-of-policy`, payload);
    return data;
  }

  static async getOutstandingAdvancesReport(payload: SiteRequest & Record<string, unknown>): Promise<ExpenseReport[]> {
    const { data } = await api.post(`${this.BASE}/report/outstanding-advances`, payload);
    return data;
  }

  static async getByDateReport(payload: SiteRequest & Record<string, unknown>): Promise<ExpenseReport[]> {
    const { data } = await api.post(`${this.BASE}/report/by-date`, payload);
    return data;
  }
}
