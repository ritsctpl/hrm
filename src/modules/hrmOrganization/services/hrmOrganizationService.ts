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

export class HrmOrganizationService {
  private static readonly BASE = '/hrm-service/organization';

  // ============================================
  // Company Profile
  // ============================================

  static async fetchBySite(site: string): Promise<CompanyProfileResponse> {
    const res = await api.post(`${this.BASE}/company/retrieveBySite`, { site });
    return res.data;
  }

  // static async fetchAllCompanies(site: string): Promise<CompanyProfileResponse[]> {
  //   const res = await api.post(`${this.BASE}/company/retrieveAll`, { site });
  //   return res.data;
  // }

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

  static async fetchCompanyByHandle(site: string, handle: string): Promise<CompanyProfileResponse> {
    const res = await api.post(`${this.BASE}/company/retrieve`, { site, handle });
    return res.data;
  }

  static async deleteCompany(site: string, handle: string, deletedBy: string): Promise<any> {
    const res = await api.post(`${this.BASE}/company/delete`, { site, handle, deletedBy });
    return res.data;
  }

  static async updateFinancialYear(payload: {
    site: string;
    handle: string;
    financialYearStartMonth: string;
    financialYearEndMonth: string;
    modifiedBy: string;
  }): Promise<CompanyProfileResponse> {
    const res = await api.post(`${this.BASE}/company/updateFinancialYear`, payload);
    return res.data;
  }

  static async uploadLogo(
    site: string,
    companyHandle: string,
    file: File,
    uploadedBy: string
  ): Promise<CompanyLogoUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('site', site);
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

  static async fetchBusinessUnit(site: string, handle: string): Promise<BusinessUnitResponse> {
    const res = await api.post(`${this.BASE}/businessUnit/retrieve`, { site, handle });
    return res.data;
  }

  static async fetchBusinessUnitsByState(
    site: string,
    companyHandle: string,
    state: string
  ): Promise<BusinessUnitResponse[]> {
    const res = await api.post(`${this.BASE}/businessUnit/retrieveByState`, {
      site,
      companyHandle,
      state,
    });
    return res.data;
  }

  static async fetchBusinessUnits(
    site: string,
    companyHandle: string
  ): Promise<BusinessUnit[]> {
    const payload = { site, companyHandle };
    console.log('fetchBusinessUnits API call - payload:', payload);
    const res = await api.post(`${this.BASE}/businessUnit/retrieveAll`, payload);
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
    site: string,
    handle: string,
    deletedBy: string
  ): Promise<any> {
    const res = await api.post(`${this.BASE}/businessUnit/delete`, { site, handle, deletedBy });
    return res.data;
  }

  // ============================================
  // Departments
  // ============================================

  static async fetchDepartment(site: string, handle: string): Promise<DepartmentResponse> {
    const res = await api.post(`${this.BASE}/department/retrieve`, { site, handle });
    return res.data;
  }

  static async fetchDepartments(site: string, buHandle: string): Promise<Department[]> {
    const res = await api.post(`${this.BASE}/department/retrieveAll`, { site, buHandle });
    return res.data;
  }

  static async fetchDepartmentHierarchy(
    site: string,
    buHandle: string
  ): Promise<DepartmentNode[]> {
    const res = await api.post(`${this.BASE}/department/hierarchy`, { site, buHandle });
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
    site: string,
    handle: string,
    deletedBy: string
  ): Promise<any> {
    const res = await api.post(`${this.BASE}/department/delete`, { site, handle, deletedBy });
    return res.data;
  }

  // ============================================
  // Locations
  // ============================================

  static async createLocation(payload: LocationRequest): Promise<LocationResponse> {
    const res = await api.post(`${this.BASE}/location/create`, payload);
    return res.data;
  }

  static async fetchLocation(site: string, id: string): Promise<LocationResponse> {
    const res = await api.post(`${this.BASE}/location/retrieve`, { site, id });
    return res.data;
  }

  static async fetchAllLocations(site: string): Promise<Location[]> {
    const res = await api.post(`${this.BASE}/location/retrieveAll`, { site });
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
    site: string,
    id: string,
    deletedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/location/delete`, { site, id, deletedBy });
  }

  // ============================================
  // Org Hierarchy
  // ============================================

  static async fetchOrgHierarchy(
    site: string,
    companyHandle: string
  ): Promise<OrgHierarchyResponse> {
    const res = await api.post(`${this.BASE}/hierarchy`, { site, companyHandle });
    return res.data;
  }

  // ============================================
  // Audit Log
  // ============================================

  static async fetchAuditLog(
    site: string,
    entityType: string,
    entityHandle: string
  ): Promise<OrgAuditLogDto[]> {
    const res = await api.post(`${this.BASE}/audit/retrieve`, {
      site,
      entityType,
      entityHandle,
    });
    return res.data;
  }

  // ============================================
  // Reports
  // ============================================

  static async generateDataCompletenessReport(
    site: string,
    entityType?: string
  ): Promise<DataCompletenessReportResponse[]> {
    const res = await api.post(`${this.BASE}/report/dataCompleteness`, {
      site,
      ...(entityType ? { entityType } : {}),
    });
    return res.data;
  }

  // ============================================
  // Export
  // ============================================

  static async exportToCSV(site: string, entityType?: string): Promise<Blob> {
    const res = await api.post(
      `${this.BASE}/export`,
      { site, ...(entityType ? { entityType } : {}) },
      { responseType: 'blob' }
    );
    return res.data;
  }
}
