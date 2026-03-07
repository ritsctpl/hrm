import api from "@/services/api";
import type {
  ExpenseListRequest,
  ExpenseApproverInboxRequest,
  GetExpenseByHandleRequest,
  ExpenseCreatePayload,
  ExpenseUpdatePayload,
  ExpenseLineItemPayload,
  MileageLineItemPayload,
  ExpenseSubmitRequest,
  ExpenseApprovalPayload,
  ExpenseRejectPayload,
  ExpenseFinanceSanctionPayload,
  ExpensePaymentPayload,
  ExpenseCancelRequest,
  MileageCalculateRequest,
  SiteRequest,
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

  static async deleteExpense(payload: { site: string; handle: string }): Promise<void> {
    await api.post(`${this.BASE}/delete`, payload);
  }

  // ── Line Items ────────────────────────────────────────────────────────
  static async addLineItem(payload: ExpenseLineItemPayload): Promise<ExpenseReport> {
    const { data } = await api.post(`${this.BASE}/line-item/add`, payload);
    return data;
  }

  static async removeLineItem(payload: { site: string; handle: string; lineItemId: string }): Promise<ExpenseReport> {
    const { data } = await api.post(`${this.BASE}/line-item/remove`, payload);
    return data;
  }

  static async addMileageItem(payload: MileageLineItemPayload): Promise<ExpenseReport> {
    const { data } = await api.post(`${this.BASE}/mileage/add`, payload);
    return data;
  }

  static async removeMileageItem(payload: { site: string; handle: string; lineItemId: string }): Promise<ExpenseReport> {
    const { data } = await api.post(`${this.BASE}/mileage/remove`, payload);
    return data;
  }

  static async calculateMileage(payload: MileageCalculateRequest): Promise<{ amount: number; ratePerKm: number }> {
    const { data } = await api.post(`${this.BASE}/mileage/calculate`, payload);
    return data;
  }

  // ── Approval ─────────────────────────────────────────────────────────
  static async getSupervisorInbox(payload: ExpenseApproverInboxRequest): Promise<ExpenseReport[]> {
    const { data } = await api.post(`${this.BASE}/supervisor-inbox`, payload);
    return data;
  }

  static async getFinanceInbox(payload: ExpenseApproverInboxRequest): Promise<ExpenseReport[]> {
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

  static async recallExpense(payload: { site: string; handle: string; reason: string }): Promise<ExpenseReport> {
    const { data } = await api.post(`${this.BASE}/recall`, payload);
    return data;
  }

  // ── Attachments ──────────────────────────────────────────────────────
  static async uploadAttachment(handle: string, file: File, site: string, lineItemId?: string): Promise<{ attachmentId: string }> {
    const form = new FormData();
    form.append("file", file);
    form.append("handle", handle);
    form.append("site", site);
    if (lineItemId) form.append("lineItemId", lineItemId);
    const { data } = await api.post(`${this.BASE}/attachments/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }

  static async deleteAttachment(payload: { site: string; handle: string; attachmentId: string }): Promise<void> {
    await api.post(`${this.BASE}/attachments/delete`, payload);
  }

  // ── Config ────────────────────────────────────────────────────────────
  static async getCategories(payload: SiteRequest): Promise<ExpenseCategory[]> {
    const { data } = await api.post(`${this.BASE}/category/list`, payload);
    return data;
  }

  static async saveCategory(payload: Partial<ExpenseCategory> & { site: string }): Promise<ExpenseCategory> {
    const { data } = await api.post(`${this.BASE}/category/save`, payload);
    return data;
  }

  static async deleteCategory(payload: { site: string; handle: string }): Promise<void> {
    await api.post(`${this.BASE}/category/delete`, payload);
  }

  static async getMileageConfig(payload: SiteRequest): Promise<MileageConfig> {
    const { data } = await api.post(`${this.BASE}/mileage-config/retrieve`, payload);
    return data;
  }

  static async getEmployeeBankDetails(payload: { site: string; employeeId: string }): Promise<EmployeeBankDetails> {
    const { data } = await api.post(`${this.BASE}/employee-bank-details`, payload);
    return data;
  }

  // ── Export ────────────────────────────────────────────────────────────
  static async exportExpenses(payload: ExpenseListRequest): Promise<Blob> {
    const response = await api.post(`${this.BASE}/export`, payload, {
      responseType: "blob",
    });
    return response.data;
  }
}
