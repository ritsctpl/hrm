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

  static async fetchAllRuns(site: string): Promise<PayrollRunSummary[]> {
    const res = await api.post<PayrollRunSummary[]>(`${BASE}/getAllPayrollRuns`, { site });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getPayrollRun(site: string, payrollRunId: string): Promise<PayrollRunSummary> {
    const res = await api.post<PayrollRunSummary>(`${BASE}/getPayrollRun`, { site, payrollRunId });
    return res.data;
  }

  static async createPayrollRun(payload: CreatePayrollRunRequest): Promise<PayrollRunSummary> {
    const res = await api.post<PayrollRunSummary>(`${BASE}/createPayrollRun`, payload);
    return res.data;
  }

  static async validatePayrollRun(
    site: string,
    payrollRunId: string,
    performedBy: string
  ): Promise<PayrollRunSummary> {
    const res = await api.post<PayrollRunSummary>(`${BASE}/validatePayrollRun`, {
      site,
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
    site: string,
    payrollRunId: string,
    employeeId: string,
    performedBy: string
  ): Promise<PayrollEntry> {
    const res = await api.post<PayrollEntry>(`${BASE}/recalculateEmployee`, {
      site,
      payrollRunId,
      employeeId,
      performedBy,
    });
    return res.data;
  }

  static async getPayrollEntries(site: string, payrollRunId: string): Promise<PayrollEntry[]> {
    const res = await api.post<PayrollEntry[]>(`${BASE}/getPayrollEntries`, { site, payrollRunId });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getEmployeeEntry(
    site: string,
    payrollRunId: string,
    employeeId: string
  ): Promise<PayrollEntry> {
    const res = await api.post<PayrollEntry>(`${BASE}/getEmployeePayrollEntry`, {
      site,
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
    site: string,
    payrollRunId: string,
    performedBy: string
  ): Promise<PayrollRunSummary> {
    const res = await api.post<PayrollRunSummary>(`${BASE}/finalizePayrollRun`, {
      site,
      payrollRunId,
      performedBy,
    });
    return res.data;
  }

  static async publishPayrollRun(
    site: string,
    payrollRunId: string,
    performedBy: string
  ): Promise<PayrollRunSummary> {
    const res = await api.post<PayrollRunSummary>(`${BASE}/publishPayrollRun`, {
      site,
      payrollRunId,
      performedBy,
    });
    return res.data;
  }

  static async exportPayrollRegister(site: string, runId: string): Promise<Blob> {
    const res = await api.post(
      `${BASE}/exportPayrollRegister`,
      { site, runId },
      { responseType: 'blob' }
    );
    return res.data as Blob;
  }

  static async getTaxConfiguration(
    site: string,
    financialYearStart: number,
    regime: 'OLD' | 'NEW'
  ): Promise<TaxConfiguration> {
    const res = await api.post<TaxConfiguration>(`${BASE}/getTaxConfiguration`, {
      site,
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
    site: string,
    configType: 'PF' | 'ESI' | 'PT'
  ): Promise<StatutoryConfig> {
    const res = await api.post<StatutoryConfig>(`${BASE}/getStatutoryConfig`, {
      site,
      configType,
    });
    return res.data;
  }

  static async saveStatutoryConfig(payload: StatutoryConfig): Promise<StatutoryConfig> {
    const res = await api.post<StatutoryConfig>(`${BASE}/createStatutoryConfig`, payload);
    return res.data;
  }

  // ─── Delete / Revert Payroll Run ───────────────────────────────────────────

  static async deletePayrollRun(site: string, payrollRunId: string, deletedBy: string): Promise<void> {
    await api.post(`${BASE}/deletePayrollRun`, { site, payrollRunId, deletedBy });
  }

  static async excludeEmployee(
    site: string,
    payrollRunId: string,
    employeeId: string,
    reason: string,
    excludedBy: string
  ): Promise<void> {
    await api.post(`${BASE}/excludeEmployee`, { site, payrollRunId, employeeId, reason, excludedBy });
  }

  static async revertPayrollRun(site: string, payrollRunId: string, performedBy: string): Promise<PayrollRunSummary> {
    const res = await api.post<PayrollRunSummary>(`${BASE}/revertPayrollRun`, { site, payrollRunId, performedBy });
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
    site: string,
    employeeId: string,
    financialYear: string
  ): Promise<TaxDeclarationResponse> {
    const res = await api.post<TaxDeclarationResponse>(`${BASE}/taxDeclaration/retrieve`, {
      site,
      employeeId,
      financialYear,
    });
    return res.data;
  }

  static async approveTaxDeclaration(
    site: string,
    employeeId: string,
    financialYear: string,
    approvedBy: string
  ): Promise<TaxDeclarationResponse> {
    const res = await api.post<TaxDeclarationResponse>(`${BASE}/taxDeclaration/approve`, {
      site,
      employeeId,
      financialYear,
      approvedBy,
    });
    return res.data;
  }

  static async getTaxDeclarationsByEmployee(site: string, employeeId: string): Promise<TaxDeclarationResponse[]> {
    const res = await api.post<TaxDeclarationResponse[]>(`${BASE}/taxDeclaration/getByEmployee`, {
      site,
      employeeId,
    });
    return Array.isArray(res.data) ? res.data : [];
  }

  // ─── Loans ─────────────────────────────────────────────────────────────────

  static async createLoan(payload: LoanRequest): Promise<LoanResponse> {
    const res = await api.post<LoanResponse>(`${BASE}/createLoan`, payload);
    return res.data;
  }

  static async getLoansByEmployee(site: string, employeeId: string): Promise<LoanResponse[]> {
    const res = await api.post<LoanResponse[]>(`${BASE}/getLoansByEmployee`, { site, employeeId });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async updateLoanStatus(payload: LoanStatusUpdateRequest): Promise<LoanResponse> {
    const res = await api.post<LoanResponse>(`${BASE}/updateLoanStatus`, payload);
    return res.data;
  }

  // ─── Summary & Export ──────────────────────────────────────────────────────

  static async getPayrollSummary(site: string, payrollRunId: string): Promise<PayrollSummaryResponse> {
    const res = await api.post<PayrollSummaryResponse>(`${BASE}/getPayrollSummary`, { site, payrollRunId });
    return res.data;
  }

  static async exportPayrollReport(site: string, payrollRunId: string, format: string): Promise<Blob> {
    const res = await api.post(
      `${BASE}/exportPayrollReport`,
      { site, payrollRunId, format },
      { responseType: 'blob' }
    );
    return res.data as Blob;
  }

  // ─── Variance Report ────────────────────────────────────────────────────────

  static async getVarianceReport(
    site: string,
    currentRunId: string,
    previousRunId: string
  ): Promise<VarianceReportEntry[]> {
    const res = await api.post<VarianceReportEntry[]>(`${BASE}/varianceReport`, {
      site,
      currentRunId,
      previousRunId,
    });
    return Array.isArray(res.data) ? res.data : [];
  }

  // ─── Bank File ──────────────────────────────────────────────────────────────

  static async generateBankFile(
    site: string,
    payrollRunId: string,
    bankFormat?: 'NEFT' | 'RTGS' | 'IMPS'
  ): Promise<Blob> {
    const res = await api.post(
      `${BASE}/generateBankFile`,
      { site, payrollRunId, bankFormat },
      { responseType: 'blob' }
    );
    return res.data as Blob;
  }

  // ─── Payroll Schedules ──────────────────────────────────────────────────────

  static async saveSchedule(payload: PayrollScheduleRequest): Promise<PayrollScheduleResponse> {
    const res = await api.post<PayrollScheduleResponse>(`${BASE}/schedule/save`, payload);
    return res.data;
  }

  static async getSchedule(site: string, name: string): Promise<PayrollScheduleResponse> {
    const res = await api.post<PayrollScheduleResponse>(`${BASE}/schedule/retrieve`, { site, name });
    return res.data;
  }

  static async listSchedules(site: string): Promise<PayrollScheduleResponse[]> {
    const res = await api.post<PayrollScheduleResponse[]>(`${BASE}/schedule/list`, { site });
    return Array.isArray(res.data) ? res.data : [];
  }
}
