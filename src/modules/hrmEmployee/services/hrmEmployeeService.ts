/**
 * HRM Employee Service
 * Static class handling all API communication for the Employee Master module.
 * All endpoints use POST. Site is obtained from cookies at the call-site (store).
 */

import api from '@services/api';
import type {
  EmployeeSearchRequest,
  EmployeeDirectoryResponse,
  CreateEmployeeRequest,
  UpdateBasicRequest,
  UpdateOfficialRequest,
  UpdatePersonalRequest,
  UpdateContactRequest,
  BulkImportRequest,
  BulkImportResponse,
} from '../types/api.types';
import type {
  EmployeeProfile,
  Skill,
  PreviousExperience,
  EducationEntry,
  JobHistoryEntry,
  EmployeeDocument,
} from '../types/domain.types';

export class HrmEmployeeService {
  private static readonly BASE = '/hrm-service/employee';

  /** Fetch paginated employee directory */
  static async fetchDirectory(
    payload: EmployeeSearchRequest
  ): Promise<EmployeeDirectoryResponse> {
    const response = await api.post(`${this.BASE}/directory`, payload);
    return response.data;
  }

  /** Search employees by keyword (uses directory with keyword filter) */
  static async searchByKeyword(
    site: string,
    keyword: string
  ): Promise<EmployeeDirectoryResponse> {
    const response = await api.post(`${this.BASE}/directory`, { site, keyword });
    return response.data;
  }

  /** Fetch full employee profile */
  static async fetchProfile(
    site: string,
    handle: string
  ): Promise<EmployeeProfile> {
    const response = await api.post(`${this.BASE}/profile`, { site, handle });
    return response.data;
  }

  /** Create a new employee (onboarding) */
  static async createEmployee(
    payload: CreateEmployeeRequest
  ): Promise<EmployeeProfile> {
    const response = await api.post(`${this.BASE}/create`, payload);
    return response.data;
  }

  /** Update basic details */
  static async updateBasicDetails(
    payload: UpdateBasicRequest
  ): Promise<EmployeeProfile> {
    const response = await api.post(`${this.BASE}/update-basic`, payload);
    return response.data;
  }

  /** Update official details */
  static async updateOfficialDetails(
    payload: UpdateOfficialRequest
  ): Promise<EmployeeProfile> {
    const response = await api.post(`${this.BASE}/update-official`, payload);
    return response.data;
  }

  /** Update personal details */
  static async updatePersonalDetails(
    payload: UpdatePersonalRequest
  ): Promise<EmployeeProfile> {
    const response = await api.post(`${this.BASE}/update-personal`, payload);
    return response.data;
  }

  /** Update contact details */
  static async updateContactDetails(
    payload: UpdateContactRequest
  ): Promise<EmployeeProfile> {
    const response = await api.post(`${this.BASE}/update-contact`, payload);
    return response.data;
  }

  /** Change employee status (ACTIVE/INACTIVE) */
  static async changeStatus(
    site: string,
    handle: string,
    status: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/change-status`, {
      site,
      handle,
      status,
      modifiedBy,
    });
  }

  /** Add a skill to an employee */
  static async addSkill(
    site: string,
    handle: string,
    skill: Skill,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/skill/add`, {
      site,
      handle,
      skill,
      modifiedBy,
    });
  }

  /** Remove a skill from an employee */
  static async removeSkill(
    site: string,
    handle: string,
    skillId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/skill/remove`, {
      site,
      handle,
      skillId,
      modifiedBy,
    });
  }

  /** Fetch job history timeline for an employee */
  static async fetchJobHistory(
    site: string,
    handle: string
  ): Promise<JobHistoryEntry[]> {
    const response = await api.post(`${this.BASE}/job-history/retrieve`, {
      site,
      handle,
    });
    return response.data;
  }

  /** Add previous work experience */
  static async addExperience(
    site: string,
    handle: string,
    experience: PreviousExperience,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/experience/add`, {
      site,
      handle,
      experience,
      modifiedBy,
    });
  }

  /** Add education entry */
  static async addEducation(
    site: string,
    handle: string,
    education: EducationEntry,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/education/add`, {
      site,
      handle,
      education,
      modifiedBy,
    });
  }

  /** Upload employee document */
  static async uploadDocument(
    site: string,
    handle: string,
    file: File,
    docType: string,
    uploadedBy: string
  ): Promise<EmployeeDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('site', site);
    formData.append('handle', handle);
    formData.append('docType', docType);
    formData.append('uploadedBy', uploadedBy);
    const response = await api.post(`${this.BASE}/document/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  /** Delete employee document */
  static async deleteDocument(
    site: string,
    handle: string,
    docId: string,
    deletedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/document/delete`, {
      site,
      handle,
      docId,
      deletedBy,
    });
  }

  /** Bulk import employees */
  static async bulkImport(
    payload: BulkImportRequest
  ): Promise<BulkImportResponse> {
    const response = await api.post(`${this.BASE}/bulk-import`, payload);
    return response.data;
  }
}
