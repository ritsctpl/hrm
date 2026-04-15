/**
 * HRM Employee Domain Types
 * Core business entities for the Employee Master module
 * Aligned with backend API from docs/HRM/design-ui-v2/03-employee-master-ui-api.md
 */

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';
export type SkillProficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Skill {
  skillId?: string;
  skillName: string;
  proficiencyLevel: SkillProficiency;
  yearsOfExperience?: number;
  certificationLink?: string;
  certifiedOn?: string;
  expiryDate?: string;
}

export interface JobHistoryEntry {
  entryId?: string;
  designation: string;
  department: string;
  effectiveFrom: string;
  effectiveTo?: string;
  grade?: string;
  changeReason?: string;
  changedBy?: string;
}

export interface PreviousExperience {
  expId?: string;
  organization: string;
  roleDesignation: string;
  fromDate: string;
  toDate: string;
  experienceSummary?: string;
  /** @deprecated UI backward compat aliases */
  employer?: string;
  role?: string;
  description?: string;
}

export interface EducationEntry {
  eduId?: string;
  qualification: string;
  institution: string;
  yearOfPassing: number;
  gradePercentage?: string;
  fieldOfStudy?: string;
  /** @deprecated UI backward compat aliases */
  degree?: string;
  field?: string;
  year?: number;
  grade?: string;
}

export interface TrainingCert {
  trainId?: string;
  trainingName: string;
  provider: string;
  validityFrom: string;
  validityTo?: string;
  certificateDocUrl?: string;
  /** @deprecated UI backward compat aliases */
  name?: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  certificateUrl?: string;
}

export interface EmployeeDocument {
  docId: string;
  documentType: string;
  documentName: string;
  storagePath?: string;
  expiryDate?: string;
  tags?: string[];
  uploadedAt: string;
  documentBase64?: string;
  contentType?: string;
  /** @deprecated UI backward compat aliases */
  docType?: string;
  fileName?: string;
}

export interface AssetDetail {
  assetId: string;
  assetName: string;
  category: string;
  assignedDate: string;
  condition: string;
}

export interface EmployeeSummary {
  handle: string;
  employeeCode: string;
  fullName: string;
  workEmail: string;
  phone?: string;
  photoUrl?: string;
  photoBase64?: string;
  status: EmployeeStatus;
  isActive?: boolean;
  department: string;
  role?: string;
  /** UI alias - mapped from backend 'role' field for backward compat */
  designation?: string;
  location?: string;
  businessUnits?: string[];
  reportingManager?: string;
  reportingManagerName?: string;
}

export interface BasicDetails {
  fullName: string;
  workEmail: string;
  phone: string;
  photoUrl?: string;
  photoBase64?: string;
  status: string;
  employeeCode?: string;
}

export interface OfficialDetails {
  firstName: string;
  lastName: string;
  nickName?: string;
  title: string;
  department: string;
  departmentName?: string;
  organizationName?: string;
  organizationHandle?: string;
  /** Backend field name for position/role */
  role?: string;
  roleName?: string;
  /** UI alias - mapped from backend 'role' field for backward compat */
  designation?: string;
  reportingManager?: string;
  reportingManagerName?: string;
  employeeCode?: string;
  location?: string;
  locationName?: string;
  businessUnits: string[];
  businessUnitNames?: string[];
  joiningDate?: string;
}

export interface PersonalDetails {
  dateOfBirth?: string;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  bloodGroup?: BloodGroup;
  nationality?: string;
  govtIds?: Record<string, string>;
  /** @deprecated UI backward compat alias */
  governmentIds?: Record<string, string>;
}

export interface ContactDetails {
  presentAddress?: string | {
    address: string;
    city: string;
    state: string;
    country: string;
    pinZip: string;
  };
  permanentAddress?: string | {
    address: string;
    city: string;
    state: string;
    country: string;
    pinZip: string;
  };
  city?: string;
  state?: string;
  country?: string;
  pinZip?: string;
  emergencyContacts?: EmergencyContact[];
}

export interface Dependent {
  dependentId?: string;
  name: string;
  relationship: string;
  dateOfBirth?: string;
  gender?: Gender;
}

export interface VisaEntry {
  visaId?: string;
  country: string;
  visaType: string;
  issueDate: string;
  expiryDate: string;
  status: string;
}

export interface BankAccount {
  bankAccountId?: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  isPrimary: boolean;
}

export interface OnboardingChecklist {
  handle: string;
  employeeHandle: string;
  items: OnboardingItem[];
  overallStatus: string;
}

export interface OnboardingItem {
  itemId: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface AuditLogEntry {
  handle: string;
  action: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  performedBy: string;
  performedAt: string;
}

export interface Remuneration {
  currency: string;
  basicPay: number;
  hra: number;
  transportAllowance: number;
  otherAllowances: number;
  providentFundDeduction: number;
  taxDeduction: number;
  otherDeductions?: number;
  ctc: number;
  effectiveFrom: string;
  payrollGrade: string;
  approvedBy: string;
  /** @deprecated UI backward compat aliases */
  transport?: number;
  pfDeduction?: number;
  tax?: number;
}

export interface LeaveSummary {
  leaveType: string;
  balance: number;
  used: number;
  pending: number;
}

export interface EmployeeProfile {
  handle: string;
  site?: string;
  employeeCode?: string;
  isActive?: boolean;
  basicDetails: BasicDetails;
  officialDetails: OfficialDetails;
  personalDetails: PersonalDetails;
  contactDetails: ContactDetails;
  skills: Skill[];
  jobHistory: JobHistoryEntry[];
  previousExperiences: PreviousExperience[];
  educationEntries: EducationEntry[];
  trainingCertifications: TrainingCert[];
  documents: EmployeeDocument[];
  additionalDetails?: unknown;
  paySlips?: unknown;
  securityCredentials?: unknown;
  assetDetails: AssetDetail[];
  remuneration?: Remuneration;
  leaveSummary?: LeaveSummary[];
  dependents?: Dependent[];
  visaImmigration?: VisaEntry[];
  benefits?: unknown;
  createdDateTime?: string;
  modifiedDateTime?: string;
  /** @deprecated UI backward compat aliases */
  previousExperience?: PreviousExperience[];
  education?: EducationEntry[];
  trainingCerts?: TrainingCert[];
  assets?: AssetDetail[];
}
