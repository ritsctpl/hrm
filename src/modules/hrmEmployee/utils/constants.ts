/**
 * HRM Employee Constants
 * Static values, labels, and option maps
 */

import type { ProfileTabKey } from '../types/ui.types';

/** Employee status labels */
export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

/** Status color map for Ant Design Tag */
export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
};

/** Skill proficiency labels */
export const PROFICIENCY_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
};

/** Skill proficiency colors */
export const PROFICIENCY_COLORS: Record<string, string> = {
  BEGINNER: 'blue',
  INTERMEDIATE: 'cyan',
  ADVANCED: 'orange',
  EXPERT: 'green',
};

/** Asset condition colors */
export const ASSET_CONDITION_COLORS: Record<string, string> = {
  GOOD: 'green',
  FAIR: 'orange',
  POOR: 'red',
  NEW: 'blue',
};

/** Blood group options */
export const BLOOD_GROUP_OPTIONS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
] as const;

/** Gender options */
export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
] as const;

/** Marital status options */
export const MARITAL_STATUS_OPTIONS = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MARRIED', label: 'Married' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
] as const;

/** Document type options */
export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
  { value: 'PAN_CARD', label: 'PAN Card' },
  { value: 'AADHAR', label: 'Aadhar Card' },
  { value: 'OFFER_LETTER', label: 'Offer Letter' },
  { value: 'RESUME', label: 'Resume' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'OTHER', label: 'Other' },
] as const;

/** Profile tabs configuration */
export const PROFILE_TABS: { key: ProfileTabKey; label: string }[] = [
  { key: 'basic', label: 'Basic Details' },
  { key: 'official', label: 'Official Details' },
  { key: 'personal', label: 'Personal Details' },
  { key: 'contact', label: 'Contact Details' },
  { key: 'skills', label: 'Skills' },
  { key: 'jobHistory', label: 'Job History' },
  { key: 'experience', label: 'Previous Experience' },
  { key: 'education', label: 'Education' },
  { key: 'training', label: 'Training & Certs' },
  { key: 'documents', label: 'Documents' },
  { key: 'assets', label: 'Assets' },
];

/** Onboarding wizard steps */
export const ONBOARDING_STEPS = [
  { title: 'Basic Info', description: 'Name, email, phone' },
  { title: 'Official Details', description: 'Department, role, manager' },
  { title: 'Contact Info', description: 'Address, emergency contacts' },
  { title: 'Review & Submit', description: 'Confirm all details' },
];

/** Default page size for directory */
export const DEFAULT_PAGE_SIZE = 20;

/** Default country */
export const DEFAULT_COUNTRY = 'India';

/** Pagination options */
export const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];
