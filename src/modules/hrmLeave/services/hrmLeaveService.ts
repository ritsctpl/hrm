import api from "@/services/api";
import {
  BalanceQueryRequest,
  AccrualRunRequest,
  ManualAdjustmentRequest,
  BulkAdjustmentRequest,
  CompOffCreditRequest,
  CompOffSubmitRequest,
  CompOffActionRequest,
  CompOffMyRequestsRequest,
  CompOffPendingRequest,
  CompOffRequest,
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
  LeaveTypeByCodeRequest,
  DeleteLeaveTypeRequest,
  ActivateDeactivateLeaveTypeRequest,
  DeletePolicyRequest,
  EffectivePolicyRequest,
  BalanceByTypeRequest,
  TeamCalendarRequest,
  TeamCalendarEntry,
  AmendLeaveRequestPayload,
  SaveApprovalConfigRequest,
  LeaveApprovalConfig,
  ExportLeaveReportRequest,
  CalculateDaysRequest,
  CalculateDaysResponse,
  BulkApprovalRequest,
  BulkApprovalResponse,
  InitializeBalanceRequest,
  SetDelegationRequest,
  DelegationEntry,
  DeleteDelegationRequest,
  SettleSeparationRequest,
  SettleSeparationResponse,
} from "../types/api.types";

export class HrmLeaveService {
  private static readonly BASE = "/hrm-service";

  /**
   * Backend wraps most leave responses in an envelope shaped like
   * `{ handle, message_details, errorCode, response: <payload> }`. Strip
   * the envelope so callers always see the raw payload (array / object).
   * Pass-through for already-unwrapped responses.
   */
  private static unwrap<T>(data: unknown): T {
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      "response" in (data as Record<string, unknown>)
    ) {
      return (data as { response: T }).response;
    }
    return data as T;
  }

  // ── Leave Type CRUD ──────────────────────────────────────────────────

  static async createLeaveType(payload: LeaveTypeRequest): Promise<LeaveType> {
    const { data } = await api.post(`${this.BASE}/leave-type/create`, payload);
    return this.unwrap<LeaveType>(data);
  }

  static async updateLeaveType(payload: LeaveTypeRequest): Promise<LeaveType> {
    const { data } = await api.post(`${this.BASE}/leave-type/update`, payload);
    return this.unwrap<LeaveType>(data);
  }

  static async getAllLeaveTypes(payload: SiteRequest): Promise<LeaveType[]> {
    const { data } = await api.post(`${this.BASE}/leave-type/retrieve-all`, payload);
    return this.unwrap<LeaveType[]>(data) ?? [];
  }

  // ── Policy CRUD ──────────────────────────────────────────────────────

  static async createOrUpdatePolicy(payload: LeavePolicyRequest): Promise<LeavePolicy> {
    const { data } = await api.post(`${this.BASE}/leave-policy/create`, payload);
    return this.unwrap<LeavePolicy>(data);
  }

  static async getPoliciesByLeaveType(payload: LeavePolicyQueryRequest): Promise<LeavePolicy[]> {
    const { data } = await api.post(`${this.BASE}/leave-policy/retrieve`, payload);
    return this.unwrap<LeavePolicy[]>(data) ?? [];
  }

  // ── Balance APIs ─────────────────────────────────────────────────────

  static async getEmployeeBalances(payload: BalanceQueryRequest): Promise<LeaveBalanceResponse[]> {
    const { data } = await api.post(`${this.BASE}/leave-balance/retrieve`, payload);
    return this.unwrap<LeaveBalanceResponse[]>(data) ?? [];
  }

  static async recalculateBalance(payload: RecalculateRequest): Promise<number> {
    const { data } = await api.post(`${this.BASE}/leave-balance/recalculate`, payload);
    return data;
  }

  // ── Accrual APIs ─────────────────────────────────────────────────────

  static async previewAccrual(payload: AccrualRunRequest): Promise<AccrualPreviewResponse> {
    const { data } = await api.post(`${this.BASE}/accrual/preview`, payload);
    return this.unwrap<AccrualPreviewResponse>(data);
  }

  static async postAccrual(payload: AccrualRunRequest): Promise<AccrualBatch> {
    const { data } = await api.post(`${this.BASE}/accrual/post`, payload);
    return this.unwrap<AccrualBatch>(data);
  }

  static async rollbackAccrual(payload: RollbackRequest): Promise<AccrualBatch> {
    const { data } = await api.post(`${this.BASE}/accrual/rollback`, payload);
    return this.unwrap<AccrualBatch>(data);
  }

  static async getAccrualBatches(payload: YearQueryRequest): Promise<AccrualBatch[]> {
    const { data } = await api.post(`${this.BASE}/accrual/retrieve-batches`, payload);
    return this.unwrap<AccrualBatch[]>(data) ?? [];
  }

  // ── Manual Adjustment APIs ───────────────────────────────────────────

  static async postManualAdjustment(payload: ManualAdjustmentRequest): Promise<LedgerHistoryResponse> {
    const { data } = await api.post(`${this.BASE}/ledger/adjust`, payload);
    return this.unwrap<LedgerHistoryResponse>(data);
  }

  static async bulkAdjustment(payload: BulkAdjustmentRequest): Promise<LedgerHistoryResponse[]> {
    const { data } = await api.post(`${this.BASE}/ledger/bulk-adjust`, payload);
    return this.unwrap<LedgerHistoryResponse[]>(data) ?? [];
  }

  // ── Comp-Off APIs ────────────────────────────────────────────────────

  static async creditCompOff(payload: CompOffCreditRequest): Promise<LedgerHistoryResponse> {
    const { data } = await api.post(`${this.BASE}/comp-off/credit`, payload);
    return this.unwrap<LedgerHistoryResponse>(data);
  }

  // ── Comp-Off Workflow ─────────────────────────────────────────────────

  static async submitCompOffRequest(payload: CompOffSubmitRequest): Promise<CompOffRequest> {
    const res = await api.post(`${this.BASE}/comp-off/request`, payload);
    return this.unwrap<CompOffRequest>(res.data);
  }

  static async approveCompOff(payload: CompOffActionRequest): Promise<CompOffRequest> {
    const res = await api.post(`${this.BASE}/comp-off/approve`, payload);
    return this.unwrap<CompOffRequest>(res.data);
  }

  static async rejectCompOff(payload: CompOffActionRequest): Promise<CompOffRequest> {
    const res = await api.post(`${this.BASE}/comp-off/reject`, payload);
    return this.unwrap<CompOffRequest>(res.data);
  }

  static async getMyCompOffRequests(payload: CompOffMyRequestsRequest): Promise<CompOffRequest[]> {
    const res = await api.post(`${this.BASE}/comp-off/my-requests`, payload);
    return this.unwrap<CompOffRequest[]>(res.data) ?? [];
  }

  static async getPendingCompOffs(payload: CompOffPendingRequest): Promise<CompOffRequest[]> {
    const res = await api.post(`${this.BASE}/comp-off/pending-for-approver`, payload);
    return this.unwrap<CompOffRequest[]>(res.data) ?? [];
  }

  // ── Ledger History ───────────────────────────────────────────────────

  static async getLedgerHistory(payload: LedgerHistoryRequest): Promise<LedgerHistoryResponse[]> {
    const { data } = await api.post(`${this.BASE}/ledger/history`, payload);
    return this.unwrap<LedgerHistoryResponse[]>(data) ?? [];
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
    return this.unwrap<LeaveBalanceResponse[]>(data) ?? [];
  }

  static async getLeaveAvailedReport(payload: LeaveAvailedReportRequest): Promise<LedgerHistoryResponse[]> {
    const { data } = await api.post(`${this.BASE}/reports/leave-availed`, payload);
    return this.unwrap<LedgerHistoryResponse[]>(data) ?? [];
  }

  // ── Leave Request: Employee APIs ─────────────────────────────────────

  static async validateLeaveRequest(payload: LeaveRequestCreateDto): Promise<ValidationSummaryResponse> {
    const { data } = await api.post(`${this.BASE}/leave-request/validate`, payload);
    return this.unwrap<ValidationSummaryResponse>(data);
  }

  static async submitLeaveRequest(payload: LeaveRequestCreateDto): Promise<LeaveRequest> {
    const { data } = await api.post(`${this.BASE}/leave-request/submit`, payload);
    return this.unwrap<LeaveRequest>(data);
  }

  static async cancelLeaveRequest(payload: CancelLeaveRequest): Promise<LeaveRequest> {
    const { data } = await api.post(`${this.BASE}/leave-request/cancel`, payload);
    return this.unwrap<LeaveRequest>(data);
  }

  static async getMyRequests(payload: EmployeeQueryRequest): Promise<LeaveRequestResponse[]> {
    const { data } = await api.post(`${this.BASE}/leave-request/my-requests`, payload);
    return this.unwrap<LeaveRequestResponse[]>(data) ?? [];
  }

  static async getLeaveRequestById(payload: GetByIdRequest): Promise<LeaveRequestResponse> {
    const { data } = await api.post(`${this.BASE}/leave-request/retrieve`, payload);
    return this.unwrap<LeaveRequestResponse>(data);
  }

  // ── Leave Request: Approval APIs ─────────────────────────────────────

  static async approveRequest(payload: ApprovalActionRequest): Promise<LeaveRequest> {
    const { data } = await api.post(`${this.BASE}/leave-request/approve`, payload);
    return this.unwrap<LeaveRequest>(data);
  }

  static async rejectRequest(payload: ApprovalActionRequest): Promise<LeaveRequest> {
    const { data } = await api.post(`${this.BASE}/leave-request/reject`, payload);
    return this.unwrap<LeaveRequest>(data);
  }

  static async escalateRequest(payload: { organizationId: string; requestId: string }): Promise<LeaveRequest> {
    const { data } = await api.post(`${this.BASE}/leave-request/escalate`, payload);
    return this.unwrap<LeaveRequest>(data);
  }

  static async reassignRequest(payload: ApprovalActionRequest): Promise<LeaveRequest> {
    const { data } = await api.post(`${this.BASE}/leave-request/reassign`, payload);
    return this.unwrap<LeaveRequest>(data);
  }

  static async overrideRequest(
    payload: ApprovalActionRequest & { approved: boolean }
  ): Promise<LeaveRequest> {
    const { data } = await api.post(`${this.BASE}/leave-request/override`, payload);
    return this.unwrap<LeaveRequest>(data);
  }

  // ── Leave Request: Queue / Inbox APIs ────────────────────────────────

  static async getPendingForApprover(payload: ApproverInboxRequest): Promise<LeaveRequestResponse[]> {
    const { data } = await api.post(`${this.BASE}/leave-request/pending-for-approver`, payload);
    return this.unwrap<LeaveRequestResponse[]>(data) ?? [];
  }

  static async getGlobalQueue(payload: GlobalQueueRequest): Promise<LeaveRequestResponse[]> {
    const { data } = await api.post(`${this.BASE}/leave-request/global-queue`, payload);
    return this.unwrap<LeaveRequestResponse[]>(data) ?? [];
  }

  // ── Leave Type Retrieve / Delete / Toggle ───────────────────────────

  static async getLeaveTypeByCode(payload: LeaveTypeByCodeRequest): Promise<LeaveType | null> {
    const { data } = await api.post(`${this.BASE}/leave-type/retrieve`, payload);
    return this.unwrap<LeaveType | null>(data) ?? null;
  }

  static async deleteLeaveType(payload: DeleteLeaveTypeRequest): Promise<void> {
    await api.post(`${this.BASE}/leave-type/delete`, payload);
  }

  static async activateDeactivateLeaveType(payload: ActivateDeactivateLeaveTypeRequest): Promise<LeaveType> {
    const { data } = await api.post(`${this.BASE}/leave-type/activate-deactivate`, payload);
    return this.unwrap<LeaveType>(data);
  }

  // ── Policy Delete ─────────────────────────────────────────────────

  static async deletePolicy(payload: DeletePolicyRequest): Promise<void> {
    await api.post(`${this.BASE}/leave-policy/delete`, payload);
  }

  // ── Effective Policy ──────────────────────────────────────────────

  static async getEffectivePolicy(payload: EffectivePolicyRequest): Promise<LeavePolicy | null> {
    const { data } = await api.post(`${this.BASE}/leave-policy/effective`, payload);
    return this.unwrap<LeavePolicy | null>(data) ?? null;
  }

  // ── Balance By Type ───────────────────────────────────────────────

  static async getBalanceByType(payload: BalanceByTypeRequest): Promise<LeaveBalanceResponse | null> {
    const { data } = await api.post(`${this.BASE}/leave-balance/retrieve-by-type`, payload);
    return this.unwrap<LeaveBalanceResponse | null>(data) ?? null;
  }

  // ── Team Calendar ─────────────────────────────────────────────────

  static async getTeamCalendar(payload: TeamCalendarRequest): Promise<TeamCalendarEntry[]> {
    const { data } = await api.post(`${this.BASE}/leave-request/team-calendar`, payload);
    const unwrapped = this.unwrap<TeamCalendarEntry[]>(data);
    return Array.isArray(unwrapped) ? unwrapped : [];
  }

  // ── Amend Leave Request ───────────────────────────────────────────

  static async amendLeaveRequest(payload: AmendLeaveRequestPayload): Promise<LeaveRequest> {
    const { data } = await api.post(`${this.BASE}/leave-request/amend`, payload);
    return this.unwrap<LeaveRequest>(data);
  }

  // ── Approval Config ───────────────────────────────────────────────

  static async saveApprovalConfig(payload: SaveApprovalConfigRequest): Promise<LeaveApprovalConfig> {
    const { data } = await api.post(`${this.BASE}/leave-approval-config/save`, payload);
    return this.unwrap<LeaveApprovalConfig>(data);
  }

  static async getApprovalConfig(payload: SiteRequest): Promise<LeaveApprovalConfig | null> {
    const { data } = await api.post(`${this.BASE}/leave-approval-config/retrieve`, payload);
    return this.unwrap<LeaveApprovalConfig | null>(data) ?? null;
  }

  // ── Export Leave Report ───────────────────────────────────────────

  static async exportLeaveReport(payload: ExportLeaveReportRequest): Promise<Blob> {
    const response = await api.post(`${this.BASE}/reports/export`, payload, {
      responseType: "blob",
    });
    return response.data;
  }

  // ── SLA Escalations ────────────────────────────────────────────────

  static async triggerSlaEscalations(payload: SiteRequest): Promise<void> {
    await api.post(`${this.BASE}/leave-request/sla-escalations`, payload);
  }

  // ── Working Days Calculator (GAP-01, GAP-02) ────────────────────
  static async calculateWorkingDays(payload: CalculateDaysRequest): Promise<CalculateDaysResponse> {
    const res = await api.post(`${this.BASE}/leave-request/calculate-days`, payload);
    return this.unwrap<CalculateDaysResponse>(res.data);
  }

  // ── Bulk Approval (GAP-07) ──────────────────────────────────────
  static async bulkApprove(payload: BulkApprovalRequest): Promise<BulkApprovalResponse> {
    const res = await api.post(`${this.BASE}/leave-request/bulk-approve`, payload);
    return this.unwrap<BulkApprovalResponse>(res.data);
  }

  static async bulkReject(payload: BulkApprovalRequest): Promise<BulkApprovalResponse> {
    const res = await api.post(`${this.BASE}/leave-request/bulk-reject`, payload);
    return this.unwrap<BulkApprovalResponse>(res.data);
  }

  // ── Balance Initialization (GAP-06) ─────────────────────────────
  static async initializeBalances(payload: InitializeBalanceRequest): Promise<void> {
    await api.post(`${this.BASE}/leave-balance/initialize`, payload);
  }

  // ── Approval Delegation ────────────────────────────────────────────

  static async setDelegation(payload: SetDelegationRequest): Promise<void> {
    await api.post(`${this.BASE}/leave-approval-config/set-delegation`, payload);
  }

  static async getDelegations(payload: SiteRequest): Promise<DelegationEntry[]> {
    const res = await api.post(`${this.BASE}/leave-approval-config/delegations`, payload);
    return this.unwrap<DelegationEntry[]>(res.data) ?? [];
  }

  static async deleteDelegation(payload: DeleteDelegationRequest): Promise<void> {
    await api.post(`${this.BASE}/leave-approval-config/delete-delegation`, payload);
  }

  // ── Leave Settlement on Separation ─────────────────────────────────
  static async settleLeaveOnSeparation(payload: SettleSeparationRequest): Promise<SettleSeparationResponse> {
    const res = await api.post(`${this.BASE}/leave-balance/settle-separation`, payload);
    return this.unwrap<SettleSeparationResponse>(res.data);
  }
}
