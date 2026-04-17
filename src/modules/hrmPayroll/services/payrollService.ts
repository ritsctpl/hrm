import api from '@/services/api';
import type {
  PayrollRunSummary,
  PayrollEntry,
  TaxConfiguration,
  StatutoryConfig,
} from '../types/domain.types';
import type {
  CreatePayrollRunRequest,
  LopInputRequest,
  PayrollAdjustmentRequest,
  RunCalculationRequest,
  PayrollApprovalRequest,
  TaxDeclarationRequest,
  TaxDeclarationResponse,
  LoanRequest,
  LoanResponse,
  LoanStatusUpdateRequest,
  PayrollSummaryResponse,
  UpdateStatutoryConfigRequest,
  VarianceReportEntry,
  PayrollScheduleRequest,
  PayrollScheduleResponse,
} from '../types/api.types';

const BASE = '/hrm-service/payroll';

export class HrmPayrollService {

  static async fetchAllRuns(organizationId: string): Promise<PayrollRunSummary[]> {
    const res = await api.post<PayrollRunSummary[]>(`${BASE}/getAllPayrollRuns`, { organizationId });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getPayrollRun(organizationId: string, payrollRunId: string): Promise<PayrollRunSummary> {
    const res = await api.post<PayrollRunSummary>(`${BASE}/getPayrollRun`, { organizationId, payrollRunId });
    return res.data;
  }

  static async createPayrollRun(payload: CreatePayrollRunRequest): Promise<PayrollRunSummary> {
    const res = await api.post<PayrollRunSummary>(`${BASE}/createPayrollRun`, payload);
    return res.data;
  }

  static async validatePayrollRun(
    organizationId: string,
    payrollRunId: string,
    performedBy: string
  ): Promise<PayrollRunSummary> {
    const res = await api.post<PayrollRunSummary>(`${BASE}/validatePayrollRun`, {
      organizationId,
      payrollRunId,
      performedBy,
    });
    return res.data;
  }

  static async updateLop(payload: LopInputRequest): Promise<void> {
    await api.post(`${BASE}/updateLop`, payload);
  }

  static async addAdjustment(payload: PayrollAdjustmentRequest): Promise<PayrollEntry> {
    const res = await api.post<PayrollEntry>(`${BASE}/addPayrollAdjustment`, payload);
    return res.data;
  }

  static async runCalculation(payload: RunCalculationRequest): Promise<PayrollRunSummary> {
    const res = await api.post<PayrollRunSummary>(`${BASE}/runPayrollCalculation`, payload);
    return res.data;
  }

  static async recalculateEmployee(
    organizationId: string,
    payrollRunId: string,
    employeeId: string,
    performedBy: string
  ): Promise<PayrollEntry> {
    const res = await api.post<PayrollEntry>(`${BASE}/recalculateEmployee`, {
      organizationId,
      payrollRunId,
      employeeId,
      performedBy,
    });
    return res.data;
  }

  static async getPayrollEntries(organizationId: string, payrollRunId: string): Promise<PayrollEntry[]> {
    const res = await api.post<PayrollEntry[]>(`${BASE}/getPayrollEntries`, { organizationId, payrollRunId });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getEmployeeEntry(
    organizationId: string,
    payrollRunId: string,
    employeeId: string
  ): Promise<PayrollEntry> {
    const res = await api.post<PayrollEntry>(`${BASE}/getEmployeePayrollEntry`, {
      organizationId,
      payrollRunId,
      employeeId,
    });
    return res.data;
  }

  static async approvePayrollRun(payload: PayrollApprovalRequest): Promise<PayrollRunSummary> {
    const res = await api.post<PayrollRunSummary>(`${BASE}/approvePayrollRun`, payload);
    return res.data;
  }

  static async finalizePayrollRun(
    organizationId: string,
    payrollRunId: string,
    performedBy: string
  ): Promise<PayrollRunSummary> {
    const res = await api.post<PayrollRunSummary>(`${BASE}/finalizePayrollRun`, {
      organizationId,
      payrollRunId,
      performedBy,
    });
    return res.data;
  }

  static async publishPayrollRun(
    organizationId: string,
    payrollRunId: string,
    performedBy: string
  ): Promise<PayrollRunSummary> {
    const res = await api.post<PayrollRunSummary>(`${BASE}/publishPayrollRun`, {
      organizationId,
      payrollRunId,
      performedBy,
    });
    return res.data;
  }

  static async exportPayrollRegister(organizationId: string, runId: string): Promise<Blob> {
    const res = await api.post(
      `${BASE}/exportPayrollRegister`,
      { organizationId, runId },
      { responseType: 'blob' }
    );
    return res.data as Blob;
  }

  static async getTaxConfiguration(
    organizationId: string,
    financialYearStart: number,
    regime: 'OLD' | 'NEW'
  ): Promise<TaxConfiguration> {
    const res = await api.post<TaxConfiguration>(`${BASE}/getTaxConfiguration`, {
      organizationId,
      financialYearStart,
      regime,
    });
    return res.data;
  }

  static async saveTaxConfiguration(payload: TaxConfiguration): Promise<TaxConfiguration> {
    const res = await api.post<TaxConfiguration>(`${BASE}/createTaxConfiguration`, payload);
    return res.data;
  }

  static async getStatutoryConfig(
    organizationId: string,
    configType: 'PF' | 'ESI' | 'PT'
  ): Promise<StatutoryConfig> {
    const res = await api.post<StatutoryConfig>(`${BASE}/getStatutoryConfig`, {
      organizationId,
      configType,
    });
    return res.data;
  }

  static async saveStatutoryConfig(payload: StatutoryConfig): Promise<StatutoryConfig> {
    const res = await api.post<StatutoryConfig>(`${BASE}/createStatutoryConfig`, payload);
    return res.data;
  }

  // ─── Delete / Revert Payroll Run ───────────────────────────────────────────

  static async deletePayrollRun(organizationId: string, payrollRunId: string, deletedBy: string): Promise<void> {
    await api.post(`${BASE}/deletePayrollRun`, { organizationId, payrollRunId, deletedBy });
  }

  static async excludeEmployee(
    organizationId: string,
    payrollRunId: string,
    employeeId: string,
    reason: string,
    excludedBy: string
  ): Promise<void> {
    await api.post(`${BASE}/excludeEmployee`, { organizationId, payrollRunId, employeeId, reason, excludedBy });
  }

  static async revertPayrollRun(organizationId: string, payrollRunId: string, performedBy: string): Promise<PayrollRunSummary> {
    const res = await api.post<PayrollRunSummary>(`${BASE}/revertPayrollRun`, { organizationId, payrollRunId, performedBy });
    return res.data;
  }

  // ─── Statutory Config Update ───────────────────────────────────────────────

  static async updateStatutoryConfig(payload: UpdateStatutoryConfigRequest): Promise<StatutoryConfig> {
    const res = await api.post<StatutoryConfig>(`${BASE}/updateStatutoryConfig`, payload);
    return res.data;
  }

  // ─── Tax Declarations ─────────────────────────────────────────────────────

  static async submitTaxDeclaration(payload: TaxDeclarationRequest): Promise<TaxDeclarationResponse> {
    const res = await api.post<TaxDeclarationResponse>(`${BASE}/taxDeclaration/submit`, payload);
    return res.data;
  }

  static async retrieveTaxDeclaration(
    organizationId: string,
    employeeId: string,
    financialYear: string
  ): Promise<TaxDeclarationResponse> {
    const res = await api.post<TaxDeclarationResponse>(`${BASE}/taxDeclaration/retrieve`, {
      organizationId,
      employeeId,
      financialYear,
    });
    return res.data;
  }

  static async approveTaxDeclaration(
    organizationId: string,
    employeeId: string,
    financialYear: string,
    approvedBy: string
  ): Promise<TaxDeclarationResponse> {
    const res = await api.post<TaxDeclarationResponse>(`${BASE}/taxDeclaration/approve`, {
      organizationId,
      employeeId,
      financialYear,
      approvedBy,
    });
    return res.data;
  }

  static async getTaxDeclarationsByEmployee(organizationId: string, employeeId: string): Promise<TaxDeclarationResponse[]> {
    const res = await api.post<TaxDeclarationResponse[]>(`${BASE}/taxDeclaration/getByEmployee`, {
      organizationId,
      employeeId,
    });
    return Array.isArray(res.data) ? res.data : [];
  }

  // ─── Loans ─────────────────────────────────────────────────────────────────

  static async createLoan(payload: LoanRequest): Promise<LoanResponse> {
    const res = await api.post<LoanResponse>(`${BASE}/createLoan`, payload);
    return res.data;
  }

  static async getLoansByEmployee(organizationId: string, employeeId: string): Promise<LoanResponse[]> {
    const res = await api.post<LoanResponse[]>(`${BASE}/getLoansByEmployee`, { organizationId, employeeId });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async updateLoanStatus(payload: LoanStatusUpdateRequest): Promise<LoanResponse> {
    const res = await api.post<LoanResponse>(`${BASE}/updateLoanStatus`, payload);
    return res.data;
  }

  // ─── Summary & Export ──────────────────────────────────────────────────────

  static async getPayrollSummary(organizationId: string, payrollRunId: string): Promise<PayrollSummaryResponse> {
    const res = await api.post<PayrollSummaryResponse>(`${BASE}/getPayrollSummary`, { organizationId, payrollRunId });
    return res.data;
  }

  static async exportPayrollReport(organizationId: string, payrollRunId: string, format: string): Promise<Blob> {
    const res = await api.post(
      `${BASE}/exportPayrollReport`,
      { organizationId, payrollRunId, format },
      { responseType: 'blob' }
    );
    return res.data as Blob;
  }

  // ─── Variance Report ────────────────────────────────────────────────────────

  static async getVarianceReport(
    organizationId: string,
    currentRunId: string,
    previousRunId: string
  ): Promise<VarianceReportEntry[]> {
    const res = await api.post<VarianceReportEntry[]>(`${BASE}/varianceReport`, {
      organizationId,
      currentRunId,
      previousRunId,
    });
    return Array.isArray(res.data) ? res.data : [];
  }

  // ─── Bank File ──────────────────────────────────────────────────────────────

  static async generateBankFile(
    organizationId: string,
    payrollRunId: string,
    bankFormat?: 'NEFT' | 'RTGS' | 'IMPS'
  ): Promise<Blob> {
    const res = await api.post(
      `${BASE}/generateBankFile`,
      { organizationId, payrollRunId, bankFormat },
      { responseType: 'blob' }
    );
    return res.data as Blob;
  }

  // ─── Payroll Schedules ──────────────────────────────────────────────────────

  static async saveSchedule(payload: PayrollScheduleRequest): Promise<PayrollScheduleResponse> {
    const res = await api.post<PayrollScheduleResponse>(`${BASE}/schedule/save`, payload);
    return res.data;
  }

  static async getSchedule(organizationId: string, name: string): Promise<PayrollScheduleResponse> {
    const res = await api.post<PayrollScheduleResponse>(`${BASE}/schedule/retrieve`, { organizationId, name });
    return res.data;
  }

  static async listSchedules(organizationId: string): Promise<PayrollScheduleResponse[]> {
    const res = await api.post<PayrollScheduleResponse[]>(`${BASE}/schedule/list`, { organizationId });
    return Array.isArray(res.data) ? res.data : [];
  }
}
