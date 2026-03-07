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

  static async exportPayrollRegister(site: string, payrollRunId: string): Promise<Blob> {
    const res = await api.post(
      `${BASE}/exportPayrollRegister`,
      { site, payrollRunId },
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
}
