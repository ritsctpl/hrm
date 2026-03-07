/**
 * HRM Organization Module - Constants
 */

export const INDUSTRY_OPTIONS = [
  { label: 'Manufacturing', value: 'Manufacturing' },
  { label: 'Information Technology', value: 'Information Technology' },
  { label: 'Healthcare', value: 'Healthcare' },
  { label: 'Finance & Banking', value: 'Finance & Banking' },
  { label: 'Retail', value: 'Retail' },
  { label: 'Education', value: 'Education' },
  { label: 'Pharmaceuticals', value: 'Pharmaceuticals' },
  { label: 'Automotive', value: 'Automotive' },
  { label: 'Construction', value: 'Construction' },
  { label: 'Telecommunications', value: 'Telecommunications' },
  { label: 'Energy', value: 'Energy' },
  { label: 'Agriculture', value: 'Agriculture' },
  { label: 'Logistics & Transportation', value: 'Logistics & Transportation' },
  { label: 'Hospitality', value: 'Hospitality' },
  { label: 'Other', value: 'Other' },
] as const;

export const BU_TYPE_OPTIONS = [
  { label: 'Corporate', value: 'Corporate' },
  { label: 'Regional', value: 'Regional' },
  { label: 'Branch', value: 'Branch' },
  { label: 'Division', value: 'Division' },
  { label: 'Subsidiary', value: 'Subsidiary' },
  { label: 'Plant', value: 'Plant' },
  { label: 'Warehouse', value: 'Warehouse' },
] as const;

export const ACCOUNT_TYPE_OPTIONS = [
  { label: 'Current Account', value: 'Current' },
  { label: 'Savings Account', value: 'Savings' },
  { label: 'Salary Account', value: 'Salary' },
] as const;

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
] as const;

export const COUNTRY_OPTIONS = [
  { label: 'India', value: 'India' },
  { label: 'United States', value: 'United States' },
  { label: 'United Kingdom', value: 'United Kingdom' },
  { label: 'Singapore', value: 'Singapore' },
  { label: 'United Arab Emirates', value: 'United Arab Emirates' },
] as const;

export const EMPTY_ADDRESS = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  pinCode: '',
  country: 'India',
} as const;

export const EMPTY_BANK_ACCOUNT = {
  bankName: '',
  branchName: '',
  accountNumber: '',
  ifscCode: '',
  accountType: 'Current',
  isPrimary: false,
} as const;

export const MAIN_TAB_LABELS = {
  company: 'Company Profile',
  businessUnit: 'Business Units',
  department: 'Departments',
  location: 'Locations',
  hierarchy: 'Hierarchy',
} as const;

export const LOCATION_TYPE_OPTIONS = [
  { label: 'Head Office', value: 'Head Office' },
  { label: 'Branch Office', value: 'Branch Office' },
  { label: 'Regional Office', value: 'Regional Office' },
  { label: 'Warehouse', value: 'Warehouse' },
  { label: 'Factory', value: 'Factory' },
  { label: 'Other', value: 'Other' },
] as const;

export const COMPANY_TAB_LABELS = {
  identity: 'Identity',
  statutory: 'Statutory',
  bank: 'Bank Accounts',
  address: 'Address',
  contact: 'Contact',
} as const;

export const BU_TAB_LABELS = {
  general: 'General',
  contact: 'Contact',
  address: 'Address',
  statutory: 'Statutory',
} as const;
