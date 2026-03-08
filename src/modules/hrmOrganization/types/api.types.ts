/**
 * HRM Organization Module - API Types
 * Request/response interfaces for all API operations
 * Aligned with backend API from docs/HRM/design-ui-v2/01-organization-setup-ui-api.md
 */

import type {
  CompanyProfile,
  BusinessUnit,
  Department,
  DepartmentNode,
  Address,
  BankAccount,
  OrgHierarchyBuEntry,
  OrgAuditLogEntry,
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
  companyName?: string;
  legalName: string;
  registrationNumber?: string;
  pan?: string;
  cin?: string;
  industryType?: string;
  foundedDate?: string;
  website?: string;
  officialEmail: string;
  officialPhone: string;
  gstin?: string;
  pfEstablishmentCode?: string;
  financialYearStartMonth?: string;
  registeredOfficeAddress?: Address;
  corporateOfficeAddress?: Address;
  bankAccounts?: BankAccount[];
  createdBy?: string;
  modifiedBy?: string;
}

export type CompanyProfileResponse = CompanyProfile;

export interface CompanyLogoUploadResponse {
  logoUrl: string;
  logoFileName?: string;
  logoContentType?: string;
  logoFileSizeBytes?: number;
}

// ============================================
// Business Unit API Types
// ============================================
export interface BusinessUnitRetrieveAllRequest {
  site: string;
}

export interface BusinessUnitRequest {
  site: string;
  companyHandle: string;
  buCode: string;
  buName: string;
  description?: string;
  headOfBu?: string;
  status?: string;
  state: string;
  placeOfSupply?: string;
  gstin?: string;
  address?: Address;
  primaryContact?: string;
  statutoryRegistrationLinks?: Record<string, string>;
  active?: number;
  createdBy?: string;
  modifiedBy?: string;
  /** @deprecated UI backward compat */
  buType?: string;
  /** @deprecated UI backward compat */
  city?: string;
  /** @deprecated UI backward compat */
  contactEmail?: string;
  /** @deprecated UI backward compat */
  contactPhone?: string;
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
  companyHandle?: string;
  deptCode: string;
  deptName: string;
  parentDeptHandle?: string;
  headOfDepartmentEmployeeId?: string;
  /** @deprecated UI backward compat */
  headEmployeeHandle?: string;
  /** @deprecated UI backward compat */
  headEmployeeName?: string;
  active?: number;
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
  type?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode?: string;
  /** UI alias for backward compat */
  pinZip?: string;
  active?: number;
  createdBy?: string;
  modifiedBy?: string;
}

export interface LocationResponse {
  id: string;
  site: string;
  code: string;
  name: string;
  type?: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  active: number;
  createdBy?: string;
  modifiedBy?: string;
  createdAt: string;
  modifiedAt: string | null;
}

// ============================================
// Org Hierarchy API Types
// ============================================
export interface OrgHierarchyResponse {
  company: CompanyProfileResponse;
  businessUnits: OrgHierarchyBuEntry[];
}

// ============================================
// Audit Log API Types
// ============================================
export type OrgAuditLogDto = OrgAuditLogEntry;

// ============================================
// Data Completeness API Types
// ============================================
export interface DataCompletenessReportResponse {
  entityType: string;
  entityHandle: string;
  entityName: string;
  missingFields: string[];
  completenessPercentage: number;
}
