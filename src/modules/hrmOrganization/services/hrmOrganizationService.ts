/**
 * HRM Organization Module - Service Layer
 * Static class handling all API calls for organization operations
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
} from '../types/api.types';
import type { BusinessUnit, Department, DepartmentNode } from '../types/domain.types';

export class HrmOrganizationService {
  private static readonly BASE = '/hrm-service/organization';

  // ============================================
  // Company Profile
  // ============================================

  static async fetchBySite(site: string): Promise<CompanyProfileResponse> {
    const res = await api.post(`${this.BASE}/company/retrieveBySite`, { site });
    return res.data;
  }

  static async createCompany(payload: CompanyProfileRequest): Promise<CompanyProfileResponse> {
    const res = await api.post(`${this.BASE}/company/create`, payload);
    return res.data;
  }

  static async updateCompany(
    handle: string,
    payload: CompanyProfileRequest
  ): Promise<CompanyProfileResponse> {
    const res = await api.post(`${this.BASE}/company/update`, { ...payload, handle });
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

  static async fetchBusinessUnits(
    site: string,
    companyHandle: string
  ): Promise<BusinessUnit[]> {
    const res = await api.post(`${this.BASE}/business-unit/retrieveAll`, {
      site,
      companyHandle,
    });
    return res.data;
  }

  static async createBusinessUnit(payload: BusinessUnitRequest): Promise<BusinessUnitResponse> {
    const res = await api.post(`${this.BASE}/business-unit/create`, payload);
    return res.data;
  }

  static async updateBusinessUnit(
    handle: string,
    payload: BusinessUnitRequest
  ): Promise<BusinessUnitResponse> {
    const res = await api.post(`${this.BASE}/business-unit/update`, { ...payload, handle });
    return res.data;
  }

  static async deleteBusinessUnit(
    site: string,
    handle: string,
    deletedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/business-unit/delete`, { site, handle, deletedBy });
  }

  // ============================================
  // Departments
  // ============================================

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

  static async updateDepartment(
    handle: string,
    payload: DepartmentRequest
  ): Promise<DepartmentResponse> {
    const res = await api.post(`${this.BASE}/department/update`, { ...payload, handle });
    return res.data;
  }

  static async deleteDepartment(
    site: string,
    handle: string,
    deletedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/department/delete`, { site, handle, deletedBy });
  }
}
