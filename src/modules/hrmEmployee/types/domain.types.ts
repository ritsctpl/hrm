/**
 * HRM Employee Domain Types
 * Core business entities for the Employee Master module
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
  skillId: string;
  skillName: string;
  proficiency: SkillProficiency;
}

export interface JobHistoryEntry {
  date: string;
  fromRole: string;
  toRole: string;
  fromDept: string;
  toDept: string;
  reason: string;
}

export interface PreviousExperience {
  employer: string;
  role: string;
  fromDate: string;
  toDate: string;
  description?: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  year: number;
  grade?: string;
}

export interface TrainingCert {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  certificateUrl?: string;
}

export interface EmployeeDocument {
  docId: string;
  docType: string;
  fileName: string;
  uploadedAt: string;
  expiryDate?: string;
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
  department: string;
  designation: string;
  status: EmployeeStatus;
  photoUrl?: string;
  workEmail: string;
}

export interface BasicDetails {
  fullName: string;
  workEmail: string;
  phone: string;
  photoUrl?: string;
  status: string;
}

export interface OfficialDetails {
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  designation: string;
  reportingManager?: string;
  businessUnits: string[];
  joiningDate: string;
}

export interface PersonalDetails {
  dateOfBirth?: string;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  bloodGroup?: BloodGroup;
  governmentIds?: Record<string, string>;
}

export interface ContactDetails {
  presentAddress?: Address;
  permanentAddress?: Address;
  emergencyContacts?: EmergencyContact[];
}

export interface Dependent {
  dependentId: string;
  name: string;
  relationship: string;
  dateOfBirth?: string;
  gender?: Gender;
}

export interface VisaEntry {
  visaId: string;
  country: string;
  visaType: string;
  issueDate: string;
  expiryDate: string;
  status: string;
}

export interface BankAccount {
  bankAccountId: string;
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

export interface EmployeeProfile {
  handle: string;
  site: string;
  employeeCode: string;
  basicDetails: BasicDetails;
  officialDetails: OfficialDetails;
  personalDetails: PersonalDetails;
  contactDetails: ContactDetails;
  skills: Skill[];
  jobHistory: JobHistoryEntry[];
  previousExperience: PreviousExperience[];
  education: EducationEntry[];
  trainingCerts: TrainingCert[];
  documents: EmployeeDocument[];
  assets: AssetDetail[];
}
