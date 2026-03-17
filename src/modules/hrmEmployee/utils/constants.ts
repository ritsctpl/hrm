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

/** Profile tabs configuration (consolidated from 13 → 5) */
export const PROFILE_TABS: { key: ProfileTabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'contactFamily', label: 'Contact & Family' },
  { key: 'career', label: 'Career' },
  { key: 'documentsAssets', label: 'Documents & Assets' },
  { key: 'compensation', label: 'Compensation' },
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

/** Country-State mapping for address dropdowns */
export const COUNTRY_STATE_MAP: Record<string, string[]> = {
  'India': [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Puducherry',
    'Lakshadweep',
    'Daman and Diu',
    'Dadra and Nagar Haveli',
    'Chandigarh',
    'Delhi',
    'Ladakh',
    'Jammu and Kashmir',
  ],
  'United States': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming',
  ],
  'United Kingdom': [
    'England', 'Scotland', 'Wales', 'Northern Ireland',
  ],
  'Canada': [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
    'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
    'Quebec', 'Saskatchewan', 'Yukon',
  ],
  'Australia': [
    'New South Wales', 'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia',
    'Australian Capital Territory', 'Northern Territory',
  ],
};

/** List of countries for dropdown */
export const COUNTRY_OPTIONS = Object.keys(COUNTRY_STATE_MAP).sort();

/** Government ID types */
export const GOVT_ID_TYPES = [
  { value: 'PAN', label: 'PAN Card' },
  { value: 'AADHAR', label: 'Aadhar Card' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
  { value: 'VOTER_ID', label: 'Voter ID' },
  { value: 'NATIONAL_ID', label: 'National ID' },
] as const;

/** PAN validation regex - Format: AAAAA9999A */
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

/** Aadhar validation regex - 12 digits */
export const AADHAR_REGEX = /^[0-9]{12}$/;

/** Passport validation regex - flexible format */
export const PASSPORT_REGEX = /^[A-Z0-9]{6,9}$/;

/** Driving License validation regex - flexible format */
export const DRIVING_LICENSE_REGEX = /^[A-Z0-9]{8,16}$/;
