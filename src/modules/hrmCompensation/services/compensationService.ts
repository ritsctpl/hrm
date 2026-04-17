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

  static async fetchAllPayComponents(organizationId: string): Promise<PayComponent[]> {
    const res = await api.post<PayComponent[]>(`${BASE}/getAllPayComponents`, { organizationId });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getPayComponent(organizationId: string, componentCode: string): Promise<PayComponent> {
    const res = await api.post<PayComponent>(`${BASE}/getPayComponent`, { organizationId, componentCode });
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

  static async deletePayComponent(organizationId: string, componentId: string, deletedBy: string): Promise<void> {
    await api.post(`${BASE}/deletePayComponent`, { organizationId, componentId, deletedBy });
  }

  // ============================================================
  // Salary Structures
  // ============================================================

  static async fetchAllSalaryStructures(organizationId: string): Promise<SalaryStructure[]> {
    const res = await api.post<SalaryStructure[]>(`${BASE}/getAllSalaryStructures`, { organizationId });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getSalaryStructure(organizationId: string, structureCode: string): Promise<SalaryStructure> {
    const res = await api.post<SalaryStructure>(`${BASE}/getSalaryStructure`, { organizationId, structureCode });
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
    organizationId: string,
    employeeId: string,
  ): Promise<EmployeeCompensationResponse> {
    const res = await api.post<EmployeeCompensationResponse>(`${BASE}/getActiveCompensation`, {
      organizationId,
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
    organizationId: string,
    employeeId: string,
  ): Promise<EmployeeCompensationResponse[]> {
    const res = await api.post<EmployeeCompensationResponse[]>(
      `${BASE}/getCompensationHistory`,
      { organizationId, employeeId },
    );
    return Array.isArray(res.data) ? res.data : [];
  }

  // ============================================================
  // Approvals
  // ============================================================

  static async getPendingApprovals(organizationId: string): Promise<EmployeeCompensationResponse[]> {
    const res = await api.post<EmployeeCompensationResponse[]>(
      `${BASE}/getPendingCompensationApprovals`,
      { organizationId },
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
    organizationId: string,
    employeeId: string,
  ): Promise<EmployeeCompensationResponse> {
    const res = await api.post<EmployeeCompensationResponse>(
      `${BASE}/getSalaryBreakdown`,
      { organizationId, employeeId },
    );
    return res.data;
  }

  // ============================================================
  // Salary Structure Delete / Deactivate
  // ============================================================

  static async deleteSalaryStructure(organizationId: string, structureId: string, deletedBy: string): Promise<void> {
    await api.post(`${BASE}/deleteSalaryStructure`, { organizationId, structureId, deletedBy });
  }

  static async deactivateSalaryStructure(organizationId: string, structureId: string, updatedBy: string): Promise<void> {
    await api.post(`${BASE}/deactivateSalaryStructure`, { organizationId, structureId, updatedBy });
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
    organizationId: string,
    employeeId: string,
    date: string,
  ): Promise<EmployeeCompensationResponse> {
    const res = await api.post<EmployeeCompensationResponse>(
      `${BASE}/getCompensationOnDate`,
      { organizationId, employeeId, date },
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
    organizationId: string,
    startDate: string,
    endDate: string,
    department?: string,
  ): Promise<RevisionReportResponse> {
    const res = await api.post<RevisionReportResponse>(
      `${BASE}/revisionReport`,
      { organizationId, startDate, endDate, department },
    );
    return res.data;
  }
}
