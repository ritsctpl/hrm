/**
 * HRM Organization Module - Domain Types
 * Core business entity interfaces for Company, Business Unit, and Department
 * Aligned with backend API response shapes from docs/HRM/design-ui-v2/01-organization-setup-ui-api.md
 */

export interface CompanyProfile {
  handle: string;
  site: string;
  legalName: string;
  companyName?: string;
  registrationNumber?: string;
  logoUrl?: string;
  logoFileName?: string;
  logoContentType?: string;
  logoFileSizeBytes?: number;
  industryType?: string;
  cin?: string;
  pan?: string;
  tan?: string;
  gstin?: string;
  msmeUdyam?: string;
  pfEstablishmentCode?: string;
  esicCode?: string;
  website?: string;
  foundedDate?: string;
  registeredOfficeAddress?: Address;
  corporateOfficeAddress?: Address;
  officialEmail: string;
  officialPhone: string;
  bankAccounts: BankAccount[];
  financialYearStartMonth?: string;
  financialYearEndMonth?: string;
  active: number;
  createdBy?: string;
  modifiedBy?: string;
  createdDateTime?: string;
  modifiedDateTime?: string;
  /** @deprecated UI backward compat aliases */
  tradeName?: string;
  industry?: string;
  incorporationDate?: string;
  pfRegistrationNo?: string;
  esiRegistrationNo?: string;
  msmeRegistrationNo?: string;
  ptRegistrationNo?: string;
  lwfRegistrationNo?: string;
  registeredAddress?: Address;
  corporateAddress?: Address;
}

export interface BankAccount {
  bankAccountHandle?: string;
  bankName: string;
  /** Backend field name */
  branch: string;
  /** UI alias for backward compat */
  branchName?: string;
  /** Backend field name */
  ifsc: string;
  /** UI alias for backward compat */
  ifscCode?: string;
  accountNumber: string;
  accountType: string;
  isPrimary: boolean;
  primary?: boolean;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  /** Backend field name */
  pincode: string;
  /** UI alias for backward compat */
  pinCode?: string;
  postalCode?: string;
  country: string;
}

export interface BusinessUnit {
  handle: string;
  site: string;
  companyHandle: string;
  buCode: string;
  buName: string;
  description?: string;
  headOfBu?: string;
  status?: string;
  state: string;
  address?: Address;
  placeOfSupply?: string;
  gstin?: string;
  linkedBankAccountHandles?: string[];
  primaryContact?: string;
  statutoryRegistrationLinks?: Record<string, string>;
  active: number;
  departmentCount?: number;
  createdBy?: string;
  modifiedBy?: string;
  createdDateTime?: string;
  modifiedDateTime?: string;
  /** @deprecated UI backward compat */
  buType?: string;
  /** @deprecated UI backward compat */
  city?: string;
  /** @deprecated UI backward compat */
  contactEmail?: string;
  /** @deprecated UI backward compat */
  contactPhone?: string;
}

export interface Department {
  handle: string;
  site: string;
  buHandle: string;
  buName?: string;
  companyHandle?: string;
  deptCode: string;
  deptName: string;
  parentDeptHandle?: string;
  parentDeptName?: string;
  managerRoleCode?: string;
  headOfDepartmentEmployeeId?: string;
  /** @deprecated UI backward compat */
  headEmployeeHandle?: string;
  /** @deprecated UI backward compat */
  headEmployeeName?: string;
  active: number;
  children?: DepartmentNode[];
  createdBy?: string;
  modifiedBy?: string;
  createdDateTime?: string;
  modifiedDateTime?: string;
}

export interface DepartmentNode extends Department {
  children?: DepartmentNode[];
}

export interface Location {
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
  /** Backend field name */
  pincode: string;
  /** UI alias for backward compat */
  pinZip?: string;
  active: number;
  createdBy?: string;
  modifiedBy?: string;
  createdAt?: string;
  modifiedAt?: string;
  /** Backward compat alias */
  createdDateTime?: string;
  /** Backward compat alias */
  modifiedDateTime?: string;
}

export interface OrgHierarchy {
  company: CompanyProfile;
  businessUnits: OrgHierarchyBuEntry[];
}

export interface OrgHierarchyBuEntry {
  businessUnit: BusinessUnit;
  departments: DepartmentNode[];
}

export interface OrgAuditLogEntry {
  handle: string;
  site: string;
  entityType: string;
  entityHandle: string;
  action: string;
  beforeValue: unknown;
  afterValue: unknown;
  performedBy: string;
  performedAt: string;
  remarks: string | null;
}

export interface DataCompletenessRow {
  entityType: string;
  entityHandle: string;
  entityName: string;
  missingFields: string[];
  completenessPercentage: number;
}
