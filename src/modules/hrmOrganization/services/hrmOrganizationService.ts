/**
 * HRM Organization Module - Service Layer
 * Static class handling all API calls for organization operations
 * Aligned with backend API from docs/HRM/design-ui-v2/01-organization-setup-ui-api.md
 */

import api from '@services/api';
import type {
  CompanyProfileRequest,
  CompanyProfileResponse,
  CompanyLogoUploadResponse,
  BusinessUnitRequest,
  BusinessUnitResponse,
  DepartmentRequest,
  DepartmentResponse,
  LocationRequest,
  LocationResponse,
  OrgHierarchyResponse,
  OrgAuditLogDto,
  DataCompletenessReportResponse,
} from '../types/api.types';
import type { BusinessUnit, Department, DepartmentNode, Location } from '../types/domain.types';

/**
 * Lightweight organization summary returned by
 * /hrm-service/organization/retrieveAll. Each record describes one company
 * (which in this app's model is a distinct data-scope — employees, roles,
 * and RBAC are all created per-company).
 *
 * `organizationId` here is whatever value should land in the `site` cookie
 * when this entry is selected in the header switcher. When the backend
 * provides a per-company `handle`, it's used as the organizationId so
 * downstream scoping reads it automatically — modules don't need to know
 * about the tenant/company distinction.
 */
export interface OrganizationSummary {
  organizationId: string;
  organizationName: string;
}

export class HrmOrganizationService {
  private static readonly BASE = '/hrm-service/organization';

  // ============================================
  // Organizations (tenant-level)
  // ============================================

  /**
   * Fetch every org visible to the caller — used by the header switcher.
   *
   * organizationId convention in this app: ALWAYS derived from `legalName`
   * — trimmed, with whitespace runs collapsed to a single `_`. Example:
   * "RITS Consulting and Technology Pvt Ltd" → "RITS_Consulting_and_Technology_Pvt_Ltd".
   *
   * We deliberately ignore any `organizationId` / `handle` / `site` field
   * the backend may return for this endpoint — those are legacy short
   * handles (e.g. "RITS") and the app has converged on legalName-derived
   * ids as the canonical identifier.
   */
  static async fetchAllOrganizations(): Promise<OrganizationSummary[]> {
    const res = await api.post(`${this.BASE}/retrieveAll`, {});
    const raw = Array.isArray(res.data) ? res.data : (res.data?.organizations ?? []);
    return (raw as Array<Record<string, unknown>>)
      .map((o) => {
        const legalName = String(o.legalName ?? o.organizationName ?? o.name ?? '').trim();
        const id = legalName.replace(/\s+/g, '_');
        return {
          organizationId: id,
          organizationName: legalName || id,
        };
      })
      .filter((o) => o.organizationId);
  }

  // ============================================
  // Company Profile
  // ============================================

  static async fetchBySite(organizationId: string): Promise<CompanyProfileResponse> {
    const res = await api.post(`${this.BASE}/company/retrieveBySite`, { organizationId });
    return res.data;
  }

  static async fetchAllCompanies(organizationId: string): Promise<CompanyProfileResponse[]> {
    const res = await api.post(`${this.BASE}/company/retrieveAll`, { organizationId });
    return res.data;
  }

  static async createCompany(payload: CompanyProfileRequest): Promise<CompanyProfileResponse> {
    const res = await api.post(`${this.BASE}/company/create`, payload);
    return res.data;
  }

  /** Update company. Backend expects { handle, companyProfileRequest: {...} } */
  static async updateCompany(
    handle: string,
    companyProfileRequest: CompanyProfileRequest
  ): Promise<CompanyProfileResponse> {
    const res = await api.post(`${this.BASE}/company/update`, { handle, companyProfileRequest });
    return res.data;
  }

  static async fetchCompanyByHandle(organizationId: string, handle: string): Promise<CompanyProfileResponse> {
    const res = await api.post(`${this.BASE}/company/retrieve`, { organizationId, handle });
    return res.data;
  }

  static async deleteCompany(organizationId: string, handle: string, deletedBy: string): Promise<any> {
    const res = await api.post(`${this.BASE}/company/delete`, { organizationId, handle, deletedBy });
    return res.data;
  }

  static async updateFinancialYear(payload: {
    organizationId: string;
    handle: string;
    financialYearStartMonth: string;
    financialYearEndMonth: string;
    modifiedBy: string;
  }): Promise<CompanyProfileResponse> {
    const res = await api.post(`${this.BASE}/company/updateFinancialYear`, payload);
    return res.data;
  }

  static async uploadLogo(
    organizationId: string,
    companyHandle: string,
    file: File,
    uploadedBy: string
  ): Promise<CompanyLogoUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('organizationId', organizationId);
    formData.append('companyHandle', companyHandle);
    formData.append('uploadedBy', uploadedBy);
    const res = await api.post(`${this.BASE}/company/uploadLogo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  // ============================================
  // Business Units
  // ============================================

  static async fetchBusinessUnit(organizationId: string, handle: string): Promise<BusinessUnitResponse> {
    const res = await api.post(`${this.BASE}/businessUnit/retrieve`, { organizationId, handle });
    return res.data;
  }

  static async fetchBusinessUnitsByState(
    organizationId: string,
    companyHandle: string,
    state: string
  ): Promise<BusinessUnitResponse[]> {
    const res = await api.post(`${this.BASE}/businessUnit/retrieveByState`, {
      organizationId,
      companyHandle,
      state,
    });
    return res.data;
  }

  static async fetchBusinessUnits(
    organizationId: string,
    companyHandle: string
  ): Promise<BusinessUnit[]> {
    const payload = { organizationId, companyHandle };
    const res = await api.post(`${this.BASE}/businessUnit/retrieveAll`, payload);
    return res.data;
  }

  /** Fetch all business units for a site (no company handle scoping). */
  static async fetchBusinessUnitsBySite(organizationId: string): Promise<BusinessUnit[]> {
    const res = await api.post(`${this.BASE}/businessUnit/retrieveAllBySite`, { organizationId });
    return res.data;
  }

  static async createBusinessUnit(payload: BusinessUnitRequest): Promise<BusinessUnitResponse> {
    const res = await api.post(`${this.BASE}/businessUnit/create`, payload);
    return res.data;
  }

  /** Update BU. Backend expects { handle, businessUnitRequest: {...} } */
  static async updateBusinessUnit(
    handle: string,
    businessUnitRequest: BusinessUnitRequest
  ): Promise<BusinessUnitResponse> {
    const res = await api.post(`${this.BASE}/businessUnit/update`, { handle, businessUnitRequest });
    return res.data;
  }

  static async deleteBusinessUnit(
    organizationId: string,
    handle: string,
    deletedBy: string
  ): Promise<any> {
    const res = await api.post(`${this.BASE}/businessUnit/delete`, { organizationId, handle, deletedBy });
    return res.data;
  }

  // ============================================
  // Departments
  // ============================================

  static async fetchDepartment(organizationId: string, handle: string): Promise<DepartmentResponse> {
    const res = await api.post(`${this.BASE}/department/retrieve`, { organizationId, handle });
    return res.data;
  }

  static async fetchDepartments(organizationId: string, buHandle: string): Promise<Department[]> {
    const res = await api.post(`${this.BASE}/department/retrieveAll`, { organizationId, buHandle });
    return res.data;
  }

  static async fetchDepartmentHierarchy(
    organizationId: string,
    buHandle: string
  ): Promise<DepartmentNode[]> {
    const res = await api.post(`${this.BASE}/department/hierarchy`, { organizationId, buHandle });
    return res.data;
  }

  static async createDepartment(payload: DepartmentRequest): Promise<DepartmentResponse> {
    const res = await api.post(`${this.BASE}/department/create`, payload);
    return res.data;
  }

  /** Update department. Backend expects { handle, departmentRequest: {...} } */
  static async updateDepartment(
    handle: string,
    departmentRequest: DepartmentRequest
  ): Promise<DepartmentResponse> {
    const res = await api.post(`${this.BASE}/department/update`, { handle, departmentRequest });
    return res.data;
  }

  static async deleteDepartment(
    organizationId: string,
    handle: string,
    deletedBy: string
  ): Promise<any> {
    const res = await api.post(`${this.BASE}/department/delete`, { organizationId, handle, deletedBy });
    return res.data;
  }

  // ============================================
  // Locations
  // ============================================

  static async createLocation(payload: LocationRequest): Promise<LocationResponse> {
    const res = await api.post(`${this.BASE}/location/create`, payload);
    return res.data;
  }

  static async fetchLocation(organizationId: string, id: string): Promise<LocationResponse> {
    const res = await api.post(`${this.BASE}/location/retrieve`, { organizationId, id });
    return res.data;
  }

  static async fetchAllLocations(organizationId: string): Promise<Location[]> {
    const res = await api.post(`${this.BASE}/location/retrieveAll`, { organizationId });
    return res.data;
  }

  /** Update location. Backend expects { id, locationRequest: {...} } */
  static async updateLocation(
    id: string,
    locationRequest: LocationRequest
  ): Promise<LocationResponse> {
    const res = await api.post(`${this.BASE}/location/update`, { id, locationRequest });
    return res.data;
  }

  static async deleteLocation(
    organizationId: string,
    id: string,
    deletedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/location/delete`, { organizationId, id, deletedBy });
  }

  // ============================================
  // Org Hierarchy
  // ============================================

  static async fetchOrgHierarchy(
    organizationId: string,
    companyHandle: string
  ): Promise<OrgHierarchyResponse> {
    const res = await api.post(`${this.BASE}/hierarchy`, { organizationId, companyHandle });
    return res.data;
  }

  // ============================================
  // Audit Log
  // ============================================

  static async fetchAuditLog(
    organizationId: string,
    entityType: string,
    entityHandle: string
  ): Promise<OrgAuditLogDto[]> {
    const res = await api.post(`${this.BASE}/audit/retrieve`, {
      organizationId,
      entityType,
      entityHandle,
    });
    return res.data;
  }

  // ============================================
  // Reports
  // ============================================

  static async generateDataCompletenessReport(
    organizationId: string,
    entityType?: string
  ): Promise<DataCompletenessReportResponse[]> {
    const res = await api.post(`${this.BASE}/report/dataCompleteness`, {
      organizationId,
      ...(entityType ? { entityType } : {}),
    });
    return res.data;
  }

  // ============================================
  // Export
  // ============================================

  static async exportToCSV(organizationId: string, entityType?: string): Promise<Blob> {
    const res = await api.post(
      `${this.BASE}/export`,
      { organizationId, ...(entityType ? { entityType } : {}) },
      { responseType: 'blob' }
    );
    return res.data;
  }
}
