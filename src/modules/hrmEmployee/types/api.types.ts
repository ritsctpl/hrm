/**
 * HRM Employee API Types
 * Request/Response types for the Employee Master module API layer
 * Aligned with backend API from docs/HRM/design-ui-v2/03-employee-master-ui-api.md
 */

import type {
  EmployeeStatus,
  Skill,
  PreviousExperience,
  EducationEntry,
  EmergencyContact,
  Gender,
  MaritalStatus,
  BloodGroup,
} from './domain.types';

/** Directory search request payload */
export interface EmployeeSearchRequest {
  organizationId: string;
  keyword?: string;
  department?: string;
  role?: string;
  location?: string;
  status?: EmployeeStatus | null;
  isActive?: boolean | null;
  businessUnit?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

/** Directory search response (backend returns totalCount/totalPages/page/size) */
export interface EmployeeDirectoryResponse {
  employees: EmployeeDirectoryRow[];
  totalCount: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface EmployeeDirectoryRow {
  handle: string;
  employeeCode: string;
  fullName: string;
  workEmail: string;
  phone?: string;
  photoUrl?: string;
  status: EmployeeStatus;
  isActive?: boolean;
  department: string;
  role: string;
  location?: string;
  businessUnits?: string[];
  reportingManager?: string;
  reportingManagerName?: string;
}

/** Create employee (onboarding) */
export interface CreateEmployeeRequest {
  organizationId: string;
  employeeCode?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  workEmail: string;
  phone: string;
  title: string;
  department: string;
  role?: string;
  location?: string;
  businessUnits: string[];
  reportingManager?: string;
  nickName?: string;
  createdBy: string;
  organizationHandle?: string;
  organizationName?: string;
  /** @deprecated UI backward compat - mapped to 'role' by buildCreateRequest */
  designation?: string;
  /** Employee's date of joining (ISO YYYY-MM-DD). */
  joiningDate?: string;
  presentAddress?: string | { line1: string; line2?: string; city: string; state: string; pinCode: string; country: string; };
  permanentAddress?: string | { line1: string; line2?: string; city: string; state: string; pinCode: string; country: string; };
  emergencyContacts?: import('./domain.types').EmergencyContact[];
}

/** Update basic details */
export interface UpdateBasicRequest {
  organizationId: string;
  handle: string;
  fullName?: string;
  phone?: string;
  photoUrl?: string | null;
  photoBase64?: string;
  modifiedBy: string;
}

/** Update official details */
export interface UpdateOfficialRequest {
  organizationId: string;
  handle: string;
  firstName: string;
  lastName: string;
  nickName?: string;
  title: string;
  department: string;
  role?: string;
  reportingManager?: string;
  location?: string;
  businessUnits: string[];
  /** Employee's date of joining (ISO YYYY-MM-DD). */
  joiningDate?: string;
  modifiedBy: string;
}

/** Update personal details */
export interface UpdatePersonalRequest {
  organizationId: string;
  handle: string;
  dateOfBirth?: string;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  bloodGroup?: BloodGroup;
  nationality?: string;
  govtIds?: Array<{ idType: string; idNumber: string; verified?: boolean }>;
  modifiedBy: string;
}

/** Update contact details */
export interface UpdateContactRequest {
  organizationId: string;
  handle: string;
  presentAddress?: {
    address: string;
    city: string;
    state: string;
    country: string;
    pinZip: string;
  };
  permanentAddress?: {
    address: string;
    city: string;
    state: string;
    country: string;
    pinZip: string;
  };
  emergencyContacts?: EmergencyContact[];
  modifiedBy: string;
}

/** Skill operation request */
export interface SkillOperationRequest {
  organizationId: string;
  handle: string;
  skill?: Skill;
  skillId?: string;
  addedBy?: string;
  modifiedBy: string;
}

/** Experience operation request */
export interface ExperienceOperationRequest {
  organizationId: string;
  handle: string;
  experience: PreviousExperience;
  expId?: string;
  modifiedBy: string;
}

/** Education operation request */
export interface EducationOperationRequest {
  organizationId: string;
  handle: string;
  entry: EducationEntry;
  eduId?: string;
  modifiedBy: string;
}

/** Training operation request */
export interface TrainingOperationRequest {
  organizationId: string;
  handle: string;
  certification: import('./domain.types').TrainingCert;
  trainId?: string;
  modifiedBy: string;
}

/** Document upload metadata */
export interface DocumentUploadMetadata {
  organizationId: string;
  employeeHandle: string;
  documentType: string;
  documentName: string;
  expiryDate?: string;
  tags?: string[];
  uploadedBy: string;
}

/** Document delete request */
export interface DocumentDeleteRequest {
  organizationId: string;
  handle: string;
  docId: string;
  deletedBy: string;
}

/** Change status request */
export interface ChangeStatusRequest {
  organizationId: string;
  handle: string;
  newStatus: EmployeeStatus;
  reason: string;
  effectiveDate?: string;
  modifiedBy: string;
}

/** Change manager request */
export interface ChangeManagerRequest {
  organizationId: string;
  handle: string;
  newManagerHandle: string;
  effectiveDate?: string;
  reason?: string;
  modifiedBy: string;
}

/** Delete employee request */
export interface DeleteEmployeeRequest {
  organizationId: string;
  handle: string;
  deletedBy: string;
  reason?: string;
}

/** Bulk import */
export interface BulkImportRequest {
  organizationId: string;
  employees: CreateEmployeeRequest[];
  dryRun?: boolean;
  importedBy: string;
}

export interface BulkImportResponse {
  totalRows: number;
  successCount: number;
  failureCount: number;
  committed?: boolean;
  errors: BulkImportError[];
  importJobId?: string;
}

export interface BulkImportError {
  rowIndex: number;
  field?: string;
  message?: string;
  employeeName?: string;
  errorMessage?: string;
}

/** Bulk assign manager request */
export interface BulkAssignManagerRequest {
  organizationId: string;
  handles: string[];
  managerHandle: string;
  modifiedBy: string;
}

/** Bulk change department request */
export interface BulkChangeDepartmentRequest {
  organizationId: string;
  handles: string[];
  department: string;
  modifiedBy: string;
}

/** Bulk assign BU request */
export interface BulkAssignBuRequest {
  organizationId: string;
  handles: string[];
  buHandle: string;
  modifiedBy: string;
}

/** Bulk operation response */
export interface BulkOperationResponse {
  totalProcessed?: number;
  successCount?: number;
  failureCount?: number;
  errors?: BulkImportError[];
  // The API actually returns an array of updated employee summaries directly
  [key: string]: unknown;
}

/** Alert response for expiring items */
export interface ExpiringAlertResponse {
  handle: string;
  employeeHandle: string;
  employeeName: string;
  itemName: string;
  expiryDate: string;
  daysUntilExpiry: number;
}

/** Employee hierarchy node — recursive, matches backend EmployeeHierarchyNode DTO */
export interface EmployeeHierarchyNode {
  handle: string;
  employeeCode: string;
  fullName: string;
  workEmail: string;
  status: string;
  department: string;
  role: string;
  designation: string;
  location: string;
  reportingManager: string;
  level: number;
  directReports: EmployeeHierarchyNode[];
}

/** Direct reports response */
export interface DirectReportResponse {
  handle: string;
  employeeCode: string;
  fullName: string;
  workEmail: string;
  phone?: string;
  photoUrl?: string;
  status: EmployeeStatus;
  department: string;
  role?: string;
  location?: string;
  businessUnits?: string[];
  reportingManager?: string;
  reportingManagerName?: string;
}

/** Audit log paginated response */
export interface AuditLogResponse {
  content: import('./domain.types').AuditLogEntry[];
  totalElements: number;
  page: number;
  size: number;
}

/** Onboarding initiate request */
export interface InitiateOnboardingRequest {
  organizationId: string;
  handle: string;
  initiatedBy: string;
}

/** Onboarding item update request */
export interface UpdateOnboardingItemRequest {
  organizationId: string;
  handle: string;
  itemId: string;
  isCompleted: boolean;
  completedBy: string;
}

/** Dependent operation request */
export interface DependentOperationRequest {
  organizationId: string;
  handle: string;
  dependent: import('./domain.types').Dependent;
  dependentId?: string;
  modifiedBy: string;
}

/** Visa operation request */
export interface VisaOperationRequest {
  organizationId: string;
  handle: string;
  visa: import('./domain.types').VisaEntry;
  visaId?: string;
  modifiedBy: string;
}

/** Bank account operation request */
export interface BankAccountOperationRequest {
  organizationId: string;
  handle: string;
  bankAccount: import('./domain.types').BankAccount;
  bankAccountId?: string;
  modifiedBy: string;
}

/** Document signed URL response */
export interface DocumentSignedUrlResponse {
  url: string;
  expiresAt?: string;
}

/** Department / BU lookup */
export interface LookupOption {
  value: string;
  label: string;
}
