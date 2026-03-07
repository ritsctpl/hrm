import api from "@/services/api";
import {
  BalanceQueryRequest,
  AccrualRunRequest,
  ManualAdjustmentRequest,
  BulkAdjustmentRequest,
  CompOffCreditRequest,
  LeaveRequestCreateDto,
  ApprovalActionRequest,
  CancelLeaveRequest,
  EmployeeQueryRequest,
  GetByIdRequest,
  ApproverInboxRequest,
  GlobalQueueRequest,
  LeaveTypeRequest,
  LeavePolicyRequest,
  PayrollExportRequest,
  LedgerHistoryRequest,
  RollbackRequest,
  YearQueryRequest,
  YearEndRequest,
  LockMonthRequest,
  ReportQueryRequest,
  LeaveAvailedReportRequest,
  SiteRequest,
  LeavePolicyQueryRequest,
  RecalculateRequest,
  LeaveBalanceResponse,
  LeaveRequestResponse,
  AccrualPreviewResponse,
  AccrualBatch,
  LedgerHistoryResponse,
  LeaveType,
  LeavePolicy,
  ValidationSummaryResponse,
  LeaveRequest,
} from "../types/api.types";

export class HrmLeaveService {
  private static readonly BASE = "app/v1/hrm-service";

  // ── Leave Type CRUD ──────────────────────────────────────────────────

  static async createLeaveType(payload: LeaveTypeRequest): Promise<LeaveType> {
    const { data } = await api.post(`${this.BASE}/leave-type/create`, payload);
    return data;
  }

  static async updateLeaveType(payload: LeaveTypeRequest): Promise<LeaveType> {
    const { data } = await api.post(`${this.BASE}/leave-type/update`, payload);
    return data;
  }

  static async getAllLeaveTypes(payload: SiteRequest): Promise<LeaveType[]> {
    const { data } = await api.post(`${this.BASE}/leave-type/retrieve-all`, payload);
    return data;
  }

  // ── Policy CRUD ──────────────────────────────────────────────────────

  static async createOrUpdatePolicy(payload: LeavePolicyRequest): Promise<LeavePolicy> {
    const { data } = await api.post(`${this.BASE}/leave-policy/create`, payload);
    return data;
  }

  static async getPoliciesByLeaveType(payload: LeavePolicyQueryRequest): Promise<LeavePolicy[]> {
    const { data } = await api.post(`${this.BASE}/leave-policy/retrieve`, payload);
    return data;
  }

  // ── Balance APIs ─────────────────────────────────────────────────────

  static async getEmployeeBalances(payload: BalanceQueryRequest): Promise<LeaveBalanceResponse[]> {
    const { data } = await api.post(`${this.BASE}/leave-balance/retrieve`, payload);
    return data;
  }

  static async recalculateBalance(payload: RecalculateRequest): Promise<number> {
    const { data } = await api.post(`${this.BASE}/leave-balance/recalculate`, payload);
    return data;
  }

  // ── Accrual APIs ─────────────────────────────────────────────────────

  static async previewAccrual(payload: AccrualRunRequest): Promise<AccrualPreviewResponse> {
    const { data } = await api.post(`${this.BASE}/accrual/preview`, payload);
    return data;
  }

  static async postAccrual(payload: AccrualRunRequest): Promise<AccrualBatch> {
    const { data } = await api.post(`${this.BASE}/accrual/post`, payload);
    return data;
  }

  static async rollbackAccrual(payload: RollbackRequest): Promise<AccrualBatch> {
    const { data } = await api.post(`${this.BASE}/accrual/rollback`, payload);
    return data;
  }

  static async getAccrualBatches(payload: YearQueryRequest): Promise<AccrualBatch[]> {
    const { data } = await api.post(`${this.BASE}/accrual/retrieve-batches`, payload);
    return data;
  }

  // ── Manual Adjustment APIs ───────────────────────────────────────────

  static async postManualAdjustment(payload: ManualAdjustmentRequest): Promise<LedgerHistoryResponse> {
    const { data } = await api.post(`${this.BASE}/ledger/adjust`, payload);
    return data;
  }

  static async bulkAdjustment(payload: BulkAdjustmentRequest): Promise<LedgerHistoryResponse[]> {
    const { data } = await api.post(`${this.BASE}/ledger/bulk-adjust`, payload);
    return data;
  }

  // ── Comp-Off APIs ────────────────────────────────────────────────────

  static async creditCompOff(payload: CompOffCreditRequest): Promise<LedgerHistoryResponse> {
    const { data } = await api.post(`${this.BASE}/comp-off/credit`, payload);
    return data;
  }

  // ── Ledger History ───────────────────────────────────────────────────

  static async getLedgerHistory(payload: LedgerHistoryRequest): Promise<LedgerHistoryResponse[]> {
    const { data } = await api.post(`${this.BASE}/ledger/history`, payload);
    return data;
  }

  // ── Year-End Operations ──────────────────────────────────────────────

  static async processCarryForward(payload: YearEndRequest): Promise<void> {
    await api.post(`${this.BASE}/year-end/carry-forward`, payload);
  }

  static async processLapse(payload: YearEndRequest): Promise<void> {
    await api.post(`${this.BASE}/year-end/lapse`, payload);
  }

  static async processEncashment(payload: YearEndRequest): Promise<void> {
    await api.post(`${this.BASE}/year-end/encashment`, payload);
  }

  // ── Payroll Export ───────────────────────────────────────────────────

  static async exportPayroll(payload: PayrollExportRequest): Promise<Blob> {
    const response = await api.post(`${this.BASE}/payroll/export`, payload, {
      responseType: "blob",
    });
    return response.data;
  }

  static async lockPayrollMonth(payload: LockMonthRequest): Promise<void> {
    await api.post(`${this.BASE}/payroll/lock-month`, payload);
  }

  // ── Report APIs ──────────────────────────────────────────────────────

  static async getBalanceSummaryReport(payload: ReportQueryRequest): Promise<LeaveBalanceResponse[]> {
    const { data } = await api.post(`${this.BASE}/reports/balance-summary`, payload);
    return data;
  }

  static async getLeaveAvailedReport(payload: LeaveAvailedReportRequest): Promise<LedgerHistoryResponse[]> {
    const { data } = await api.post(`${this.BASE}/reports/leave-availed`, payload);
    return data;
  }

  // ── Leave Request: Employee APIs ─────────────────────────────────────

  static async validateLeaveRequest(payload: LeaveRequestCreateDto): Promise<ValidationSummaryResponse> {
    const { data } = await api.post(`${this.BASE}/leave-request/validate`, payload);
    return data;
  }

  static async submitLeaveRequest(payload: LeaveRequestCreateDto): Promise<LeaveRequest> {
    const { data } = await api.post(`${this.BASE}/leave-request/submit`, payload);
    return data;
  }

  static async cancelLeaveRequest(payload: CancelLeaveRequest): Promise<LeaveRequest> {
    const { data } = await api.post(`${this.BASE}/leave-request/cancel`, payload);
    return data;
  }

  static async getMyRequests(payload: EmployeeQueryRequest): Promise<LeaveRequestResponse[]> {
    const { data } = await api.post(`${this.BASE}/leave-request/my-requests`, payload);
    return data;
  }

  static async getLeaveRequestById(payload: GetByIdRequest): Promise<LeaveRequestResponse> {
    const { data } = await api.post(`${this.BASE}/leave-request/retrieve`, payload);
    return data;
  }

  // ── Leave Request: Approval APIs ─────────────────────────────────────

  static async approveRequest(payload: ApprovalActionRequest): Promise<LeaveRequest> {
    const { data } = await api.post(`${this.BASE}/leave-request/approve`, payload);
    return data;
  }

  static async rejectRequest(payload: ApprovalActionRequest): Promise<LeaveRequest> {
    const { data } = await api.post(`${this.BASE}/leave-request/reject`, payload);
    return data;
  }

  static async escalateRequest(payload: { site: string; requestId: string }): Promise<LeaveRequest> {
    const { data } = await api.post(`${this.BASE}/leave-request/escalate`, payload);
    return data;
  }

  static async reassignRequest(payload: ApprovalActionRequest): Promise<LeaveRequest> {
    const { data } = await api.post(`${this.BASE}/leave-request/reassign`, payload);
    return data;
  }

  static async overrideRequest(
    payload: ApprovalActionRequest & { approved: boolean }
  ): Promise<LeaveRequest> {
    const { data } = await api.post(`${this.BASE}/leave-request/override`, payload);
    return data;
  }

  // ── Leave Request: Queue / Inbox APIs ────────────────────────────────

  static async getPendingForApprover(payload: ApproverInboxRequest): Promise<LeaveRequestResponse[]> {
    const { data } = await api.post(`${this.BASE}/leave-request/pending-for-approver`, payload);
    return data;
  }

  static async getGlobalQueue(payload: GlobalQueueRequest): Promise<LeaveRequestResponse[]> {
    const { data } = await api.post(`${this.BASE}/leave-request/global-queue`, payload);
    return data;
  }
}
