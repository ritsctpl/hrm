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
  EmployeeHierarchyNode,
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
    organizationId: string,
    workEmail: string
  ): Promise<{ available: boolean; message: string }> {
    const response = await api.post(`${this.BASE}/check-email`, { organizationId, workEmail });
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
    organizationId: string,
    keyword: string
  ): Promise<EmployeeDirectoryResponse> {
    const response = await api.post(`${this.BASE}/directory`, { organizationId, keyword });
    return response.data;
  }

  /** Fetch full employee profile */
  static async fetchProfile(
    organizationId: string,
    handle: string,
    requestingUserRole: string = 'HR'
  ): Promise<EmployeeProfile> {
    const response = await api.post(`${this.BASE}/profile`, { organizationId, handle, requestingUserRole });
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
    organizationId: string,
    handle: string,
    newStatus: string,
    reason: string,
    modifiedBy: string,
    effectiveDate?: string
  ): Promise<void> {
    await api.post(`${this.BASE}/change-status`, {
      organizationId,
      handle,
      newStatus,
      reason,
      modifiedBy,
      ...(effectiveDate ? { effectiveDate } : {}),
    });
  }

  /** Add a skill to an employee */
  static async addSkill(
    organizationId: string,
    handle: string,
    skill: Skill,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/skill/add`, {
      organizationId,
      handle,
      skill,
      addedBy: modifiedBy,
      modifiedBy,
    });
  }

  /** Remove a skill from an employee */
  static async removeSkill(
    organizationId: string,
    handle: string,
    skillId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/skill/remove`, {
      organizationId,
      handle,
      skillId,
      modifiedBy,
    });
  }

  /** Fetch job history timeline for an employee */
  static async fetchJobHistory(
    organizationId: string,
    handle: string
  ): Promise<JobHistoryEntry[]> {
    const response = await api.post(`${this.BASE}/job-history/retrieve`, {
      organizationId,
      handle,
    });
    return response.data;
  }

  /** Add previous work experience */
  static async addExperience(
    organizationId: string,
    handle: string,
    experience: PreviousExperience,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/experience/add`, {
      organizationId,
      handle,
      experience,
      modifiedBy,
    });
  }

  /** Add education entry */
  static async addEducation(
    organizationId: string,
    handle: string,
    entry: EducationEntry,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/education/add`, {
      organizationId,
      handle,
      entry,
      modifiedBy,
    });
  }

  /** Upload employee document (base64 encoded in JSON payload) */
  static async uploadDocument(
    organizationId: string,
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
      organizationId,
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
    organizationId: string,
    handle: string,
    docId: string,
    deletedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/document/delete`, {
      organizationId,
      handle,
      docId,
      deletedBy,
    });
  }

  /** Fetch employee summary */
  static async fetchSummary(
    organizationId: string,
    handle: string
  ): Promise<EmployeeSummary> {
    const response = await api.post(`${this.BASE}/summary`, { organizationId, handle });
    return response.data;
  }

  /** Change reporting manager */
  static async changeManager(
    organizationId: string,
    handle: string,
    newManagerHandle: string,
    modifiedBy: string,
    effectiveDate?: string,
    reason?: string
  ): Promise<void> {
    await api.post(`${this.BASE}/change-manager`, {
      organizationId,
      handle,
      newManagerHandle,
      modifiedBy,
      ...(effectiveDate ? { effectiveDate } : {}),
      ...(reason ? { reason } : {}),
    });
  }

  /** Delete employee */
  static async deleteEmployee(
    organizationId: string,
    handle: string,
    deletedBy: string,
    reason?: string
  ): Promise<void> {
    await api.post(`${this.BASE}/delete`, {
      organizationId,
      handle,
      deletedBy,
      ...(reason ? { reason } : {}),
    });
  }

  /** Update a skill */
  static async updateSkill(
    organizationId: string,
    handle: string,
    skillId: string,
    skill: Skill,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/skill/update`, {
      organizationId,
      handle,
      skillId,
      skill,
      modifiedBy,
    });
  }

  /** Update previous experience */
  static async updateExperience(
    organizationId: string,
    handle: string,
    experience: PreviousExperience,
    expId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/experience/update`, {
      organizationId,
      handle,
      experience,
      expId,
      modifiedBy,
    });
  }

  /** Remove previous experience */
  static async removeExperience(
    organizationId: string,
    handle: string,
    expId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/experience/remove`, {
      organizationId,
      handle,
      expId,
      modifiedBy,
    });
  }

  /** Update education entry */
  static async updateEducation(
    organizationId: string,
    handle: string,
    entry: EducationEntry,
    eduId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/education/update`, {
      organizationId,
      handle,
      entry,
      eduId,
      modifiedBy,
    });
  }

  /** Remove education entry */
  static async removeEducation(
    organizationId: string,
    handle: string,
    eduId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/education/remove`, {
      organizationId,
      handle,
      eduId,
      modifiedBy,
    });
  }

  /** Add training/certification */
  static async addTraining(
    organizationId: string,
    handle: string,
    certification: TrainingCert,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/training/add`, {
      organizationId,
      handle,
      certification,
      modifiedBy,
    });
  }

  /** Update training/certification */
  static async updateTraining(
    organizationId: string,
    handle: string,
    certification: TrainingCert,
    trainId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/training/update`, {
      organizationId,
      handle,
      certification,
      trainId,
      modifiedBy,
    });
  }

  /** Remove training/certification */
  static async removeTraining(
    organizationId: string,
    handle: string,
    trainId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/training/remove`, {
      organizationId,
      handle,
      trainId,
      modifiedBy,
    });
  }

  /** Get document signed URL */
  static async getDocumentSignedUrl(
    organizationId: string,
    handle: string,
    docId: string,
    requestingUser?: string
  ): Promise<string> {
    const response = await api.post(`${this.BASE}/document/signed-url`, {
      organizationId,
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
    organizationId: string,
    daysAhead?: number
  ): Promise<ExpiringAlertResponse[]> {
    const response = await api.post(`${this.BASE}/alerts/expiring-documents`, {
      organizationId,
      ...(daysAhead != null ? { daysAhead } : {}),
    });
    return response.data;
  }

  /** Get expiring visas alert */
  static async getExpiringVisas(
    organizationId: string,
    daysAhead?: number
  ): Promise<ExpiringAlertResponse[]> {
    const response = await api.post(`${this.BASE}/alerts/expiring-visas`, {
      organizationId,
      ...(daysAhead != null ? { daysAhead } : {}),
    });
    return response.data;
  }

  /** Get expiring certifications alert */
  static async getExpiringCertifications(
    organizationId: string,
    daysAhead?: number
  ): Promise<ExpiringAlertResponse[]> {
    const response = await api.post(`${this.BASE}/alerts/expiring-certifications`, {
      organizationId,
      ...(daysAhead != null ? { daysAhead } : {}),
    });
    return response.data;
  }

  /** Get direct reports for a manager */
  static async getDirectReports(
    organizationId: string,
    employeeId: string
  ): Promise<DirectReportResponse[]> {
    const response = await api.post(`${this.BASE}/direct-reports`, { organizationId, employeeId });
    return response.data;
  }

  /**
   * Fetch the site + organization scoped employee reporting hierarchy as a
   * pre-built tree. Backend returns a list of roots (employees with no
   * manager or manager outside the scope); each node carries `directReports`
   * recursively. The backend guarantees the tree is cycle-safe.
   */
  static async fetchEmployeeHierarchy(
    organizationId: string,
    organizationName: string
  ): Promise<EmployeeHierarchyNode[]> {
    const response = await api.post(`${this.BASE}/hierarchy`, {
      organizationId,
      organizationName,
    });
    return response.data;
  }

  /** Get audit log for an employee */
  static async getAuditLog(
    organizationId: string,
    handle: string,
    page: number,
    size: number
  ): Promise<AuditLogResponse> {
    const response = await api.post(`${this.BASE}/audit-log`, {
      organizationId,
      handle,
      page,
      size,
    });
    return response.data;
  }

  /** Upload employee photo */
  static async uploadPhoto(
    organizationId: string,
    handle: string,
    file: File
  ): Promise<EmployeeProfile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('organizationId', organizationId);
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
    organizationId: string,
    handle: string
  ): Promise<OnboardingChecklist> {
    const response = await api.post(`${this.BASE}/onboarding/retrieve`, { organizationId, handle });
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
    organizationId: string,
    handle: string,
    completedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/onboarding/complete`, {
      organizationId,
      handle,
      completedBy,
    });
  }

  /** Add dependent */
  static async addDependent(
    organizationId: string,
    handle: string,
    dependent: Dependent,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/dependent/add`, {
      organizationId,
      handle,
      dependent,
      modifiedBy,
    });
  }

  /** Update dependent */
  static async updateDependent(
    organizationId: string,
    handle: string,
    dependent: Dependent,
    dependentId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/dependent/update`, {
      organizationId,
      handle,
      dependent,
      dependentId,
      modifiedBy,
    });
  }

  /** Remove dependent */
  static async removeDependent(
    organizationId: string,
    handle: string,
    dependentId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/dependent/remove`, {
      organizationId,
      handle,
      dependentId,
      modifiedBy,
    });
  }

  /** Add visa */
  static async addVisa(
    organizationId: string,
    handle: string,
    visa: VisaEntry,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/visa/add`, {
      organizationId,
      handle,
      visa,
      modifiedBy,
    });
  }

  /** Update visa */
  static async updateVisa(
    organizationId: string,
    handle: string,
    visa: VisaEntry,
    visaId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/visa/update`, {
      organizationId,
      handle,
      visa,
      visaId,
      modifiedBy,
    });
  }

  /** Remove visa */
  static async removeVisa(
    organizationId: string,
    handle: string,
    visaId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/visa/remove`, {
      organizationId,
      handle,
      visaId,
      modifiedBy,
    });
  }

  /** Add bank account */
  static async addBankAccount(
    organizationId: string,
    handle: string,
    bankAccount: BankAccount,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/bank/add`, {
      organizationId,
      handle,
      bankAccount,
      modifiedBy,
    });
  }

  /** Update bank account */
  static async updateBankAccount(
    organizationId: string,
    handle: string,
    bankAccount: BankAccount,
    bankAccountId: string,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/bank/update`, {
      organizationId,
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
    organizationId: string,
    handle: string,
    requestingUserRole: string = 'HR'
  ): Promise<Remuneration> {
    const response = await api.post(`${this.BASE}/remuneration/retrieve`, {
      organizationId,
      handle,
      requestingUserRole,
    });
    return response.data;
  }

  /** Update remuneration */
  static async updateRemuneration(
    organizationId: string,
    handle: string,
    remuneration: Remuneration,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/remuneration/update`, {
      organizationId,
      handle,
      remuneration,
      modifiedBy,
    });
  }

  /** Fetch leave summary */
  static async fetchLeaveSummary(
    organizationId: string,
    handle: string
  ): Promise<LeaveSummary[]> {
    const response = await api.post(`${this.BASE}/leave-summary`, { organizationId, handle });
    return response.data;
  }

  /** Export employees as CSV */
  static async exportEmployees(
    organizationId: string,
    filters?: { department?: string; status?: string }
  ): Promise<Blob> {
    const response = await api.post(
      `${this.BASE}/export`,
      { organizationId, ...filters },
      { responseType: 'blob' }
    );
    return response.data;
  }

  /** Initiate offboarding */
  static async initiateOffboarding(
    organizationId: string,
    handle: string,
    exitDate: string,
    reason: string,
    initiatedBy: string
  ): Promise<unknown> {
    const response = await api.post(`${this.BASE}/offboarding/initiate`, {
      organizationId,
      handle,
      exitDate,
      reason,
      initiatedBy,
    });
    return response.data;
  }

  /** Retrieve offboarding status */
  static async getOffboarding(
    organizationId: string,
    handle: string
  ): Promise<unknown> {
    const response = await api.post(`${this.BASE}/offboarding/retrieve`, { organizationId, handle });
    return response.data;
  }

  /** Update offboarding clearance item */
  static async updateClearance(
    organizationId: string,
    handle: string,
    itemId: string,
    status: string,
    updatedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/offboarding/updateClearance`, {
      organizationId,
      handle,
      itemId,
      status,
      updatedBy,
    });
  }

  /** Complete offboarding */
  static async completeOffboarding(
    organizationId: string,
    handle: string,
    completedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/offboarding/complete`, {
      organizationId,
      handle,
      completedBy,
    });
  }

  /** Add job history entry */
  static async addJobHistory(
    organizationId: string,
    handle: string,
    entry: JobHistoryEntry,
    modifiedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/job-history/add`, {
      organizationId,
      handle,
      entry,
      modifiedBy,
    });
  }

  /** Fetch field schemas */
  static async fetchFieldSchemas(organizationId: string): Promise<unknown[]> {
    const response = await api.post('/hrm-service/schema/retrieve-all', { organizationId });
    return response.data;
  }

  /** Save field schema */
  static async saveFieldSchema(
    organizationId: string,
    schema: unknown
  ): Promise<void> {
    await api.post('/hrm-service/schema/save', { organizationId, schema });
  }
}
