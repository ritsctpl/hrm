/**
 * HRM Employee Service
 * Static class handling all API communication for the Employee Master module.
 * All endpoints use POST. Site is obtained from cookies at the call-site (store).
 * Aligned with backend API from docs/HRM/design-ui-v2/03-employee-master-ui-api.md
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
  ExpiringAlertResponse,
  DirectReportResponse,
  AuditLogResponse,
  InitiateOnboardingRequest,
  UpdateOnboardingItemRequest,
  DocumentUploadMetadata,
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
  Remuneration,
  LeaveSummary,
} from '../types/domain.types';

export class HrmEmployeeService {
  private static readonly BASE = '/hrm-service/employee';

  /** Check if work email is available */
  static async checkEmailAvailability(
    site: string,
    workEmail: string
  ): Promise<{ available: boolean; message: string }> {
    const response = await api.post(`${this.BASE}/check-email`, { site, workEmail });
    console.log('Raw API response:', response);
    console.log('Response data:', response.data);
    
    // When API returns success: true, it means email can be processed (is available)
    // The axios interceptor may or may not unwrap the response
    // Check both possible structures
    let available = false;
    let message = '';
    
    if (response.data && typeof response.data === 'object') {
      // If response.data is an object with success field
      if ('success' in response.data) {
        available = response.data.success === true;
        message = response.data.message || '';
      } else {
        // If response.data is just the boolean value after unwrapping
        available = response.data === true;
      }
    } else {
      // If response.data is a primitive boolean
      available = response.data === true;
    }
    
    const result = { available, message };
    console.log('Parsed result:', result);
    return result;
  }

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
    handle: string,
    requestingUserRole: string = 'HR'
  ): Promise<EmployeeProfile> {
    const response = await api.post(`${this.BASE}/profile`, { site, handle, requestingUserRole });
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
    newStatus: string,
    reason: string,
    modifiedBy: string,
    effectiveDate?: string
  ): Promise<void> {
    await api.post(`${this.BASE}/change-status`, {
      site,
      handle,
      newStatus,
      reason,
      modifiedBy,
      ...(effectiveDate ? { effectiveDate } : {}),
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
      addedBy: modifiedBy,
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
    entry: EducationEntry,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/education/add`, {
      site,
      handle,
      entry,
      modifiedBy,
    });
  }

  /** Upload employee document (base64 encoded in JSON payload) */
  static async uploadDocument(
    site: string,
    employeeHandle: string,
    documentType: string,
    documentName: string,
    contentType: string,
    documentBase64: string,
    uploadedBy: string,
    expiryDate?: string,
    tags?: string[]
  ): Promise<EmployeeDocument> {
    const payload = {
      site,
      employeeHandle,
      documentType,
      documentName,
      contentType,
      documentBase64,
      uploadedBy,
      expiryDate: expiryDate || null,
      tags: tags || null,
    };
    const response = await api.post(`${this.BASE}/document/upload`, payload);
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
    modifiedBy: string,
    effectiveDate?: string,
    reason?: string
  ): Promise<void> {
    await api.post(`${this.BASE}/change-manager`, {
      site,
      handle,
      newManagerHandle,
      modifiedBy,
      ...(effectiveDate ? { effectiveDate } : {}),
      ...(reason ? { reason } : {}),
    });
  }

  /** Delete employee */
  static async deleteEmployee(
    site: string,
    handle: string,
    deletedBy: string,
    reason?: string
  ): Promise<void> {
    await api.post(`${this.BASE}/delete`, {
      site,
      handle,
      deletedBy,
      ...(reason ? { reason } : {}),
    });
  }

  /** Update a skill */
  static async updateSkill(
    site: string,
    handle: string,
    skillId: string,
    skill: Skill,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/skill/update`, {
      site,
      handle,
      skillId,
      skill,
      modifiedBy,
    });
  }

  /** Update previous experience */
  static async updateExperience(
    site: string,
    handle: string,
    experience: PreviousExperience,
    expId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/experience/update`, {
      site,
      handle,
      experience,
      expId,
      modifiedBy,
    });
  }

  /** Remove previous experience */
  static async removeExperience(
    site: string,
    handle: string,
    expId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/experience/remove`, {
      site,
      handle,
      expId,
      modifiedBy,
    });
  }

  /** Update education entry */
  static async updateEducation(
    site: string,
    handle: string,
    entry: EducationEntry,
    eduId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/education/update`, {
      site,
      handle,
      entry,
      eduId,
      modifiedBy,
    });
  }

  /** Remove education entry */
  static async removeEducation(
    site: string,
    handle: string,
    eduId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/education/remove`, {
      site,
      handle,
      eduId,
      modifiedBy,
    });
  }

  /** Add training/certification */
  static async addTraining(
    site: string,
    handle: string,
    certification: TrainingCert,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/training/add`, {
      site,
      handle,
      certification,
      modifiedBy,
    });
  }

  /** Update training/certification */
  static async updateTraining(
    site: string,
    handle: string,
    certification: TrainingCert,
    trainId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/training/update`, {
      site,
      handle,
      certification,
      trainId,
      modifiedBy,
    });
  }

  /** Remove training/certification */
  static async removeTraining(
    site: string,
    handle: string,
    trainId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/training/remove`, {
      site,
      handle,
      trainId,
      modifiedBy,
    });
  }

  /** Get document signed URL */
  static async getDocumentSignedUrl(
    site: string,
    handle: string,
    docId: string,
    requestingUser?: string
  ): Promise<string> {
    const response = await api.post(`${this.BASE}/document/signed-url`, {
      site,
      handle,
      docId,
      ...(requestingUser ? { requestingUser } : {}),
    });
    // Backend returns the signed URL string directly as data
    return response.data;
  }

  /** Bulk assign manager */
  static async bulkAssignManager(
    payload: BulkAssignManagerRequest
  ): Promise<unknown> {
    const response = await api.post(`${this.BASE}/bulk-assign-manager`, payload);
    return response.data;
  }

  /** Bulk change department */
  static async bulkChangeDepartment(
    payload: BulkChangeDepartmentRequest
  ): Promise<unknown> {
    const response = await api.post(`${this.BASE}/bulk-change-department`, payload);
    return response.data;
  }

  /** Bulk assign business unit */
  static async bulkAssignBu(
    payload: BulkAssignBuRequest
  ): Promise<unknown> {
    const response = await api.post(`${this.BASE}/bulk-assign-bu`, payload);
    return response.data;
  }

  /** Get expiring documents alert */
  static async getExpiringDocuments(
    site: string,
    daysAhead?: number
  ): Promise<ExpiringAlertResponse[]> {
    const response = await api.post(`${this.BASE}/alerts/expiring-documents`, {
      site,
      ...(daysAhead != null ? { daysAhead } : {}),
    });
    return response.data;
  }

  /** Get expiring visas alert */
  static async getExpiringVisas(
    site: string,
    daysAhead?: number
  ): Promise<ExpiringAlertResponse[]> {
    const response = await api.post(`${this.BASE}/alerts/expiring-visas`, {
      site,
      ...(daysAhead != null ? { daysAhead } : {}),
    });
    return response.data;
  }

  /** Get expiring certifications alert */
  static async getExpiringCertifications(
    site: string,
    daysAhead?: number
  ): Promise<ExpiringAlertResponse[]> {
    const response = await api.post(`${this.BASE}/alerts/expiring-certifications`, {
      site,
      ...(daysAhead != null ? { daysAhead } : {}),
    });
    return response.data;
  }

  /** Get direct reports for a manager */
  static async getDirectReports(
    site: string,
    employeeId: string
  ): Promise<DirectReportResponse[]> {
    const response = await api.post(`${this.BASE}/direct-reports`, { site, employeeId });
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
    const response = await api.post(`${this.BASE}/onboarding/retrieve`, { site, handle });
    return response.data;
  }

  /** Update onboarding item */
  static async updateOnboardingItem(
    payload: UpdateOnboardingItemRequest
  ): Promise<OnboardingChecklist> {
    const response = await api.post(`${this.BASE}/onboarding/updateItem`, payload);
    return response.data;
  }

  /** Complete onboarding */
  static async completeOnboarding(
    site: string,
    handle: string,
    completedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/onboarding/complete`, {
      site,
      handle,
      completedBy,
    });
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

  /** Fetch remuneration details */
  static async fetchRemuneration(
    site: string,
    handle: string,
    requestingUserRole: string = 'HR'
  ): Promise<Remuneration> {
    const response = await api.post(`${this.BASE}/remuneration/retrieve`, {
      site,
      handle,
      requestingUserRole,
    });
    return response.data;
  }

  /** Update remuneration */
  static async updateRemuneration(
    site: string,
    handle: string,
    remuneration: Remuneration,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/remuneration/update`, {
      site,
      handle,
      remuneration,
      modifiedBy,
    });
  }

  /** Fetch leave summary */
  static async fetchLeaveSummary(
    site: string,
    handle: string
  ): Promise<LeaveSummary[]> {
    const response = await api.post(`${this.BASE}/leave-summary`, { site, handle });
    return response.data;
  }

  /** Export employees as CSV */
  static async exportEmployees(
    site: string,
    filters?: { department?: string; status?: string }
  ): Promise<Blob> {
    const response = await api.post(
      `${this.BASE}/export`,
      { site, ...filters },
      { responseType: 'blob' }
    );
    return response.data;
  }

  /** Initiate offboarding */
  static async initiateOffboarding(
    site: string,
    handle: string,
    exitDate: string,
    reason: string,
    initiatedBy: string
  ): Promise<unknown> {
    const response = await api.post(`${this.BASE}/offboarding/initiate`, {
      site,
      handle,
      exitDate,
      reason,
      initiatedBy,
    });
    return response.data;
  }

  /** Retrieve offboarding status */
  static async getOffboarding(
    site: string,
    handle: string
  ): Promise<unknown> {
    const response = await api.post(`${this.BASE}/offboarding/retrieve`, { site, handle });
    return response.data;
  }

  /** Update offboarding clearance item */
  static async updateClearance(
    site: string,
    handle: string,
    itemId: string,
    status: string,
    updatedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/offboarding/updateClearance`, {
      site,
      handle,
      itemId,
      status,
      updatedBy,
    });
  }

  /** Complete offboarding */
  static async completeOffboarding(
    site: string,
    handle: string,
    completedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/offboarding/complete`, {
      site,
      handle,
      completedBy,
    });
  }

  /** Add job history entry */
  static async addJobHistory(
    site: string,
    handle: string,
    entry: JobHistoryEntry,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/job-history/add`, {
      site,
      handle,
      entry,
      modifiedBy,
    });
  }

  /** Fetch field schemas */
  static async fetchFieldSchemas(site: string): Promise<unknown[]> {
    const response = await api.post('/hrm-service/schema/retrieve-all', { site });
    return response.data;
  }

  /** Save field schema */
  static async saveFieldSchema(
    site: string,
    schema: unknown
  ): Promise<void> {
    await api.post('/hrm-service/schema/save', { site, schema });
  }
}
