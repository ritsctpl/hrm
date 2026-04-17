import api from "@/services/api";
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
  static async uploadAttachment(expenseId: string, file: File, organizationId: string, lineIndex: number): Promise<ReceiptUploadResponse> {
    const form = new FormData();
    form.append("file", file);
    form.append("expenseId", expenseId);
    form.append("organizationId", organizationId);
    form.append("lineIndex", String(lineIndex));
    const { data } = await api.post(`${this.BASE}/receipt/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
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
