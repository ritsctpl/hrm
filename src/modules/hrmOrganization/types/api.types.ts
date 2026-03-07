/**
 * HRM Organization Module - API Types
 * Request/response interfaces for all API operations
 */

import type {
  CompanyProfile,
  BusinessUnit,
  Department,
  DepartmentNode,
  Address,
  BankAccount,
} from './domain.types';

// ============================================
// Generic API Response
// ============================================
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: string;
  errorMessage?: string;
}

// ============================================
// Company Profile API Types
// ============================================
export interface CompanyProfileRequest {
  site: string;
  legalName: string;
  tradeName?: string;
  industry: string;
  incorporationDate: string;
  logoUrl?: string;
  pan?: string;
  tan?: string;
  cin?: string;
  pfRegistrationNo?: string;
  esiRegistrationNo?: string;
  msmeRegistrationNo?: string;
  ptRegistrationNo?: string;
  lwfRegistrationNo?: string;
  bankAccounts: BankAccount[];
  registeredAddress: Address;
  corporateAddress?: Address;
  officialEmail: string;
  officialPhone: string;
  active: number;
  createdBy?: string;
  modifiedBy?: string;
}

export type CompanyProfileResponse = CompanyProfile;

export interface CompanyLogoUploadResponse {
  logoUrl: string;
}

// ============================================
// Business Unit API Types
// ============================================
export interface BusinessUnitRetrieveAllRequest {
  site: string;
  companyHandle: string;
}

export interface BusinessUnitRequest {
  site: string;
  companyHandle: string;
  buCode: string;
  buName: string;
  buType: string;
  state: string;
  city: string;
  address?: Address;
  contactEmail?: string;
  contactPhone?: string;
  statutoryDetails?: Record<string, string>;
  active: number;
  createdBy?: string;
  modifiedBy?: string;
}

export type BusinessUnitResponse = BusinessUnit;

export interface BusinessUnitDeleteRequest {
  site: string;
  handle: string;
  deletedBy: string;
}

// ============================================
// Department API Types
// ============================================
export interface DepartmentRetrieveAllRequest {
  site: string;
  buHandle: string;
}

export interface DepartmentRequest {
  site: string;
  buHandle: string;
  deptCode: string;
  deptName: string;
  parentDeptHandle?: string;
  headEmployeeHandle?: string;
  headEmployeeName?: string;
  active: number;
  createdBy?: string;
  modifiedBy?: string;
}

export type DepartmentResponse = Department;

export interface DepartmentHierarchyResponse {
  data: DepartmentNode[];
}

export interface DepartmentDeleteRequest {
  site: string;
  handle: string;
  deletedBy: string;
}

// ============================================
// Location API Types
// ============================================
export interface LocationRequest {
  site: string;
  code: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pinZip: string;
  active?: number;
  createdBy?: string;
  modifiedBy?: string;
}

export interface LocationResponse {
  id: string;
  site: string;
  code: string;
  name: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  pinZip: string;
  active: number;
  createdDateTime: string;
  modifiedDateTime: string | null;
}

// ============================================
// Org Hierarchy API Types
// ============================================
export interface OrgHierarchyResponse {
  company: CompanyProfileResponse;
  businessUnits: (BusinessUnitResponse & { departments: DepartmentResponse[] })[];
}

// ============================================
// Audit Log API Types
// ============================================
export interface OrgAuditLogDto {
  handle: string;
  entityType: string;
  entityHandle: string;
  action: string;
  fieldKey: string | null;
  oldValue: unknown;
  newValue: unknown;
  performedBy: string;
  performedAt: string;
}

// ============================================
// Data Completeness API Types
// ============================================
export interface DataCompletenessReportResponse {
  entityHandle: string;
  entityCode: string;
  entityType: string;
  requiredFields: number;
  filledFields: number;
  missingFields: number;
  completenessPercent: number;
}
