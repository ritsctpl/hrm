/**
 * HRM Compensation Module — Service Layer
 * Static class — all API calls via api.post()
 */

import api from '@/services/api';
import type {
  PayComponentRequest,
  DeactivateComponentRequest,
  SalaryStructureRequest,
  EmployeeCompensationRequest,
  PreviewCompensationRequest,
  SubmitForApprovalRequest,
  CompensationApprovalRequest,
  BulkImportCompensationRequest,
  RevisionReportResponse,
  UpdateEmployeeCompensationRequest,
} from '../types/api.types';
import type {
  PayComponent,
  SalaryStructure,
  EmployeeCompensationResponse,
} from '../types/domain.types';

const BASE = '/hrm-service/compensation';

export class HrmCompensationService {
  // ============================================================
  // Pay Components
  // ============================================================

  static async fetchAllPayComponents(site: string): Promise<PayComponent[]> {
    const res = await api.post<PayComponent[]>(`${BASE}/getAllPayComponents`, { site });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getPayComponent(site: string, componentCode: string): Promise<PayComponent> {
    const res = await api.post<PayComponent>(`${BASE}/getPayComponent`, { site, componentCode });
    return res.data;
  }

  static async createPayComponent(payload: PayComponentRequest): Promise<PayComponent> {
    const res = await api.post<PayComponent>(`${BASE}/createPayComponent`, payload);
    return res.data;
  }

  static async updatePayComponent(
    payload: PayComponentRequest & { handle: string },
  ): Promise<PayComponent> {
    const res = await api.post<PayComponent>(`${BASE}/updatePayComponent`, payload);
    return res.data;
  }

  static async deactivatePayComponent(payload: DeactivateComponentRequest): Promise<void> {
    await api.post(`${BASE}/deactivatePayComponent`, payload);
  }

  static async deletePayComponent(site: string, componentId: string, deletedBy: string): Promise<void> {
    await api.post(`${BASE}/deletePayComponent`, { site, componentId, deletedBy });
  }

  // ============================================================
  // Salary Structures
  // ============================================================

  static async fetchAllSalaryStructures(site: string): Promise<SalaryStructure[]> {
    const res = await api.post<SalaryStructure[]>(`${BASE}/getAllSalaryStructures`, { site });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getSalaryStructure(site: string, structureCode: string): Promise<SalaryStructure> {
    const res = await api.post<SalaryStructure>(`${BASE}/getSalaryStructure`, { site, structureCode });
    return res.data;
  }

  static async createSalaryStructure(payload: SalaryStructureRequest): Promise<SalaryStructure> {
    const res = await api.post<SalaryStructure>(`${BASE}/createSalaryStructure`, payload);
    return res.data;
  }

  static async updateSalaryStructure(
    payload: SalaryStructureRequest & { handle: string },
  ): Promise<SalaryStructure> {
    const res = await api.post<SalaryStructure>(`${BASE}/updateSalaryStructure`, payload);
    return res.data;
  }

  // ============================================================
  // Employee Compensation Assignment
  // ============================================================

  static async getActiveCompensation(
    site: string,
    employeeId: string,
  ): Promise<EmployeeCompensationResponse> {
    const res = await api.post<EmployeeCompensationResponse>(`${BASE}/getActiveCompensation`, {
      site,
      employeeId,
    });
    return res.data;
  }

  static async previewCompensation(
    payload: PreviewCompensationRequest,
  ): Promise<EmployeeCompensationResponse> {
    const res = await api.post<EmployeeCompensationResponse>(
      `${BASE}/previewCompensation`,
      payload,
    );
    return res.data;
  }

  static async createEmployeeCompensation(
    payload: EmployeeCompensationRequest,
  ): Promise<EmployeeCompensationResponse> {
    const res = await api.post<EmployeeCompensationResponse>(
      `${BASE}/createEmployeeCompensation`,
      payload,
    );
    return res.data;
  }

  static async submitCompensationForApproval(
    payload: SubmitForApprovalRequest,
  ): Promise<EmployeeCompensationResponse> {
    const res = await api.post<EmployeeCompensationResponse>(
      `${BASE}/submitCompensationForApproval`,
      payload,
    );
    return res.data;
  }

  static async getCompensationHistory(
    site: string,
    employeeId: string,
  ): Promise<EmployeeCompensationResponse[]> {
    const res = await api.post<EmployeeCompensationResponse[]>(
      `${BASE}/getCompensationHistory`,
      { site, employeeId },
    );
    return Array.isArray(res.data) ? res.data : [];
  }

  // ============================================================
  // Approvals
  // ============================================================

  static async getPendingApprovals(site: string): Promise<EmployeeCompensationResponse[]> {
    const res = await api.post<EmployeeCompensationResponse[]>(
      `${BASE}/getPendingCompensationApprovals`,
      { site },
    );
    return Array.isArray(res.data) ? res.data : [];
  }

  static async approveRejectCompensation(
    payload: CompensationApprovalRequest,
  ): Promise<EmployeeCompensationResponse> {
    const res = await api.post<EmployeeCompensationResponse>(
      `${BASE}/approveRejectCompensation`,
      payload,
    );
    return res.data;
  }

  static async getSalaryBreakdown(
    site: string,
    employeeId: string,
  ): Promise<EmployeeCompensationResponse> {
    const res = await api.post<EmployeeCompensationResponse>(
      `${BASE}/getSalaryBreakdown`,
      { site, employeeId },
    );
    return res.data;
  }

  // ============================================================
  // Salary Structure Delete / Deactivate
  // ============================================================

  static async deleteSalaryStructure(site: string, structureId: string, deletedBy: string): Promise<void> {
    await api.post(`${BASE}/deleteSalaryStructure`, { site, structureId, deletedBy });
  }

  static async deactivateSalaryStructure(site: string, structureId: string, updatedBy: string): Promise<void> {
    await api.post(`${BASE}/deactivateSalaryStructure`, { site, structureId, updatedBy });
  }

  // ============================================================
  // Update Employee Compensation
  // ============================================================

  static async updateEmployeeCompensation(
    payload: UpdateEmployeeCompensationRequest,
  ): Promise<EmployeeCompensationResponse> {
    const res = await api.post<EmployeeCompensationResponse>(
      `${BASE}/updateEmployeeCompensation`,
      payload,
    );
    return res.data;
  }

  // ============================================================
  // Get Compensation on Date
  // ============================================================

  static async getCompensationOnDate(
    site: string,
    employeeId: string,
    date: string,
  ): Promise<EmployeeCompensationResponse> {
    const res = await api.post<EmployeeCompensationResponse>(
      `${BASE}/getCompensationOnDate`,
      { site, employeeId, date },
    );
    return res.data;
  }

  // ============================================================
  // Bulk Import
  // ============================================================

  static async bulkImportCompensation(
    payload: BulkImportCompensationRequest,
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    const res = await api.post(`${BASE}/bulkImport`, payload);
    return res.data;
  }

  // ============================================================
  // Revision Report
  // ============================================================

  static async revisionReport(
    site: string,
    startDate: string,
    endDate: string,
    department?: string,
  ): Promise<RevisionReportResponse> {
    const res = await api.post<RevisionReportResponse>(
      `${BASE}/revisionReport`,
      { site, startDate, endDate, department },
    );
    return res.data;
  }
}
