/**
 * HRM Employee API Types
 * Request/Response types for the Employee Master module API layer
 */

import type {
  EmployeeStatus,
  Skill,
  PreviousExperience,
  EducationEntry,
  Address,
  EmergencyContact,
  Gender,
  MaritalStatus,
  BloodGroup,
} from './domain.types';

/** Directory search request payload */
export interface EmployeeSearchRequest {
  site: string;
  keyword?: string;
  department?: string;
  status?: EmployeeStatus | null;
  businessUnit?: string;
  page?: number;
  pageSize?: number;
}

/** Directory search response */
export interface EmployeeDirectoryResponse {
  employees: EmployeeDirectoryRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface EmployeeDirectoryRow {
  handle: string;
  employeeCode: string;
  fullName: string;
  department: string;
  designation: string;
  status: EmployeeStatus;
  photoUrl?: string;
  workEmail: string;
  joiningDate?: string;
  phone?: string;
}

/** Create employee (onboarding) */
export interface CreateEmployeeRequest {
  site: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  phone: string;
  title: string;
  department: string;
  designation: string;
  businessUnits: string[];
  joiningDate: string;
  reportingManager?: string;
  presentAddress?: Address;
  permanentAddress?: Address;
  emergencyContacts?: EmergencyContact[];
  createdBy: string;
}

/** Update basic details */
export interface UpdateBasicRequest {
  site: string;
  handle: string;
  fullName: string;
  workEmail: string;
  phone: string;
  photoUrl?: string;
  status: string;
  modifiedBy: string;
}

/** Update official details */
export interface UpdateOfficialRequest {
  site: string;
  handle: string;
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  designation: string;
  reportingManager?: string;
  businessUnits: string[];
  joiningDate: string;
  modifiedBy: string;
}

/** Update personal details */
export interface UpdatePersonalRequest {
  site: string;
  handle: string;
  dateOfBirth?: string;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  bloodGroup?: BloodGroup;
  governmentIds?: Record<string, string>;
  modifiedBy: string;
}

/** Update contact details */
export interface UpdateContactRequest {
  site: string;
  handle: string;
  presentAddress?: Address;
  permanentAddress?: Address;
  emergencyContacts?: EmergencyContact[];
  modifiedBy: string;
}

/** Skill operation request */
export interface SkillOperationRequest {
  site: string;
  handle: string;
  skill?: Skill;
  skillId?: string;
  modifiedBy: string;
}

/** Experience operation request */
export interface ExperienceOperationRequest {
  site: string;
  handle: string;
  experience: PreviousExperience;
  modifiedBy: string;
}

/** Education operation request */
export interface EducationOperationRequest {
  site: string;
  handle: string;
  education: EducationEntry;
  modifiedBy: string;
}

/** Document delete request */
export interface DocumentDeleteRequest {
  site: string;
  handle: string;
  docId: string;
  deletedBy: string;
}

/** Bulk import */
export interface BulkImportRequest {
  site: string;
  employees: CreateEmployeeRequest[];
  importedBy: string;
}

export interface BulkImportResponse {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors: BulkImportError[];
}

export interface BulkImportError {
  rowIndex: number;
  employeeName: string;
  errorMessage: string;
}

/** Training operation request */
export interface TrainingOperationRequest {
  site: string;
  handle: string;
  training: import('./domain.types').TrainingCert;
  trainingId?: string;
  modifiedBy: string;
}

/** Change manager request */
export interface ChangeManagerRequest {
  site: string;
  handle: string;
  newManagerHandle: string;
  changedBy: string;
}

/** Delete employee request */
export interface DeleteEmployeeRequest {
  site: string;
  handle: string;
  deletedBy: string;
}

/** Bulk assign manager request */
export interface BulkAssignManagerRequest {
  site: string;
  employeeHandles: string[];
  managerHandle: string;
  modifiedBy: string;
}

/** Bulk change department request */
export interface BulkChangeDepartmentRequest {
  site: string;
  employeeHandles: string[];
  department: string;
  modifiedBy: string;
}

/** Bulk assign BU request */
export interface BulkAssignBuRequest {
  site: string;
  employeeHandles: string[];
  businessUnit: string;
  modifiedBy: string;
}

/** Bulk operation response */
export interface BulkOperationResponse {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors: BulkImportError[];
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

/** Direct reports response */
export interface DirectReportResponse {
  handle: string;
  employeeCode: string;
  fullName: string;
  department: string;
  designation: string;
  status: EmployeeStatus;
  photoUrl?: string;
  workEmail: string;
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
  site: string;
  handle: string;
  initiatedBy: string;
}

/** Onboarding item update request */
export interface UpdateOnboardingItemRequest {
  site: string;
  handle: string;
  itemId: string;
  isCompleted: boolean;
  completedBy: string;
}

/** Dependent operation request */
export interface DependentOperationRequest {
  site: string;
  handle: string;
  dependent: import('./domain.types').Dependent;
  dependentId?: string;
  modifiedBy: string;
}

/** Visa operation request */
export interface VisaOperationRequest {
  site: string;
  handle: string;
  visa: import('./domain.types').VisaEntry;
  visaId?: string;
  modifiedBy: string;
}

/** Bank account operation request */
export interface BankAccountOperationRequest {
  site: string;
  handle: string;
  bankAccount: import('./domain.types').BankAccount;
  bankAccountId?: string;
  modifiedBy: string;
}

/** Document signed URL response */
export interface DocumentSignedUrlResponse {
  url: string;
  expiresAt: string;
}

/** Department / BU lookup */
export interface LookupOption {
  value: string;
  label: string;
}
