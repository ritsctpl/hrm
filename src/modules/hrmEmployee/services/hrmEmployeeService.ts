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
  BulkAssignManagerRequest,
  BulkChangeDepartmentRequest,
  BulkAssignBuRequest,
  BulkOperationResponse,
  ExpiringAlertResponse,
  DirectReportResponse,
  AuditLogResponse,
  InitiateOnboardingRequest,
  UpdateOnboardingItemRequest,
  DocumentSignedUrlResponse,
} from '../types/api.types';
import type {
  EmployeeProfile,
  EmployeeSummary,
  Skill,
  PreviousExperience,
  EducationEntry,
  TrainingCert,
  JobHistoryEntry,
  EmployeeDocument,
  OnboardingChecklist,
  Dependent,
  VisaEntry,
  BankAccount,
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

  /** Fetch employee summary */
  static async fetchSummary(
    site: string,
    handle: string
  ): Promise<EmployeeSummary> {
    const response = await api.post(`${this.BASE}/summary`, { site, handle });
    return response.data;
  }

  /** Change reporting manager */
  static async changeManager(
    site: string,
    handle: string,
    newManagerHandle: string,
    changedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/change-manager`, {
      site,
      handle,
      newManagerHandle,
      changedBy,
    });
  }

  /** Delete employee */
  static async deleteEmployee(
    site: string,
    handle: string,
    deletedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/delete`, { site, handle, deletedBy });
  }

  /** Update a skill */
  static async updateSkill(
    site: string,
    handle: string,
    skill: Skill,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/skill/update`, {
      site,
      handle,
      skill,
      modifiedBy,
    });
  }

  /** Update previous experience */
  static async updateExperience(
    site: string,
    handle: string,
    experience: PreviousExperience,
    experienceId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/experience/update`, {
      site,
      handle,
      experience,
      experienceId,
      modifiedBy,
    });
  }

  /** Remove previous experience */
  static async removeExperience(
    site: string,
    handle: string,
    experienceId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/experience/remove`, {
      site,
      handle,
      experienceId,
      modifiedBy,
    });
  }

  /** Update education entry */
  static async updateEducation(
    site: string,
    handle: string,
    education: EducationEntry,
    educationId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/education/update`, {
      site,
      handle,
      education,
      educationId,
      modifiedBy,
    });
  }

  /** Remove education entry */
  static async removeEducation(
    site: string,
    handle: string,
    educationId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/education/remove`, {
      site,
      handle,
      educationId,
      modifiedBy,
    });
  }

  /** Add training/certification */
  static async addTraining(
    site: string,
    handle: string,
    training: TrainingCert,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/training/add`, {
      site,
      handle,
      training,
      modifiedBy,
    });
  }

  /** Update training/certification */
  static async updateTraining(
    site: string,
    handle: string,
    training: TrainingCert,
    trainingId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/training/update`, {
      site,
      handle,
      training,
      trainingId,
      modifiedBy,
    });
  }

  /** Remove training/certification */
  static async removeTraining(
    site: string,
    handle: string,
    trainingId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/training/remove`, {
      site,
      handle,
      trainingId,
      modifiedBy,
    });
  }

  /** Get document signed URL */
  static async getDocumentSignedUrl(
    site: string,
    handle: string,
    docId: string
  ): Promise<DocumentSignedUrlResponse> {
    const response = await api.post(`${this.BASE}/document/signed-url`, {
      site,
      handle,
      docId,
    });
    return response.data;
  }

  /** Bulk assign manager */
  static async bulkAssignManager(
    payload: BulkAssignManagerRequest
  ): Promise<BulkOperationResponse> {
    const response = await api.post(`${this.BASE}/bulk-assign-manager`, payload);
    return response.data;
  }

  /** Bulk change department */
  static async bulkChangeDepartment(
    payload: BulkChangeDepartmentRequest
  ): Promise<BulkOperationResponse> {
    const response = await api.post(`${this.BASE}/bulk-change-department`, payload);
    return response.data;
  }

  /** Bulk assign business unit */
  static async bulkAssignBu(
    payload: BulkAssignBuRequest
  ): Promise<BulkOperationResponse> {
    const response = await api.post(`${this.BASE}/bulk-assign-bu`, payload);
    return response.data;
  }

  /** Get expiring documents alert */
  static async getExpiringDocuments(
    site: string
  ): Promise<ExpiringAlertResponse[]> {
    const response = await api.post(`${this.BASE}/alerts/expiring-documents`, { site });
    return response.data;
  }

  /** Get expiring visas alert */
  static async getExpiringVisas(
    site: string
  ): Promise<ExpiringAlertResponse[]> {
    const response = await api.post(`${this.BASE}/alerts/expiring-visas`, { site });
    return response.data;
  }

  /** Get expiring certifications alert */
  static async getExpiringCertifications(
    site: string
  ): Promise<ExpiringAlertResponse[]> {
    const response = await api.post(`${this.BASE}/alerts/expiring-certifications`, { site });
    return response.data;
  }

  /** Get direct reports for a manager */
  static async getDirectReports(
    site: string,
    managerId: string
  ): Promise<DirectReportResponse[]> {
    const response = await api.post(`${this.BASE}/direct-reports`, { site, managerId });
    return response.data;
  }

  /** Get audit log for an employee */
  static async getAuditLog(
    site: string,
    handle: string,
    page: number,
    size: number
  ): Promise<AuditLogResponse> {
    const response = await api.post(`${this.BASE}/audit-log`, {
      site,
      handle,
      page,
      size,
    });
    return response.data;
  }

  /** Upload employee photo */
  static async uploadPhoto(
    site: string,
    handle: string,
    file: File
  ): Promise<EmployeeProfile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('site', site);
    formData.append('handle', handle);
    const response = await api.post(`${this.BASE}/photo/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  /** Initiate onboarding */
  static async initiateOnboarding(
    payload: InitiateOnboardingRequest
  ): Promise<OnboardingChecklist> {
    const response = await api.post(`${this.BASE}/onboarding/initiate`, payload);
    return response.data;
  }

  /** Get onboarding checklist */
  static async getOnboardingChecklist(
    site: string,
    handle: string
  ): Promise<OnboardingChecklist> {
    const response = await api.post(`${this.BASE}/onboarding/checklist`, { site, handle });
    return response.data;
  }

  /** Update onboarding item */
  static async updateOnboardingItem(
    payload: UpdateOnboardingItemRequest
  ): Promise<OnboardingChecklist> {
    const response = await api.post(`${this.BASE}/onboarding/update-item`, payload);
    return response.data;
  }

  /** Add dependent */
  static async addDependent(
    site: string,
    handle: string,
    dependent: Dependent,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/dependent/add`, {
      site,
      handle,
      dependent,
      modifiedBy,
    });
  }

  /** Update dependent */
  static async updateDependent(
    site: string,
    handle: string,
    dependent: Dependent,
    dependentId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/dependent/update`, {
      site,
      handle,
      dependent,
      dependentId,
      modifiedBy,
    });
  }

  /** Remove dependent */
  static async removeDependent(
    site: string,
    handle: string,
    dependentId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/dependent/remove`, {
      site,
      handle,
      dependentId,
      modifiedBy,
    });
  }

  /** Add visa */
  static async addVisa(
    site: string,
    handle: string,
    visa: VisaEntry,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/visa/add`, {
      site,
      handle,
      visa,
      modifiedBy,
    });
  }

  /** Update visa */
  static async updateVisa(
    site: string,
    handle: string,
    visa: VisaEntry,
    visaId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/visa/update`, {
      site,
      handle,
      visa,
      visaId,
      modifiedBy,
    });
  }

  /** Remove visa */
  static async removeVisa(
    site: string,
    handle: string,
    visaId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/visa/remove`, {
      site,
      handle,
      visaId,
      modifiedBy,
    });
  }

  /** Add bank account */
  static async addBankAccount(
    site: string,
    handle: string,
    bankAccount: BankAccount,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/bank/add`, {
      site,
      handle,
      bankAccount,
      modifiedBy,
    });
  }

  /** Update bank account */
  static async updateBankAccount(
    site: string,
    handle: string,
    bankAccount: BankAccount,
    bankAccountId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/bank/update`, {
      site,
      handle,
      bankAccount,
      bankAccountId,
      modifiedBy,
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
