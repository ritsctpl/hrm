/**
 * HRM Organization Module - Domain Types
 * Core business entity interfaces for Company, Business Unit, and Department
 */

export interface CompanyProfile {
  handle: string;
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
  createdDateTime?: string;
  modifiedDateTime?: string;
}

export interface BankAccount {
  bankName: string;
  branchName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  isPrimary: boolean;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
}

export interface BusinessUnit {
  handle: string;
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
  createdDateTime?: string;
  modifiedDateTime?: string;
}

export interface Department {
  handle: string;
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
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  pinZip: string;
  active: number;
  createdBy?: string;
  modifiedBy?: string;
  createdDateTime?: string;
  modifiedDateTime?: string;
}

export interface OrgHierarchy {
  company: CompanyProfile;
  businessUnits: (BusinessUnit & { departments: DepartmentNode[] })[];
}

export interface OrgAuditLogEntry {
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

export interface DataCompletenessRow {
  entityHandle: string;
  entityCode: string;
  entityType: string;
  requiredFields: number;
  filledFields: number;
  missingFields: number;
  completenessPercent: number;
}
