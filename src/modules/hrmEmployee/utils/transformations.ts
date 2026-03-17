/**
 * HRM Employee Data Transformations
 * Utility functions for formatting, mapping, and validating employee data
 */

import type { EmployeeSummary, EmployeeProfile } from '../types/domain.types';
import type { EmployeeDirectoryRow, CreateEmployeeRequest } from '../types/api.types';

/**
 * Map API directory row to EmployeeSummary used by the UI
 */
export function mapDirectoryRowToSummary(row: EmployeeDirectoryRow): EmployeeSummary {
  return {
    handle: row.handle,
    employeeCode: row.employeeCode,
    fullName: row.fullName,
    department: row.department,
    designation: row.role || '', // Backend returns 'role', map to 'designation' for UI
    status: row.status,
    photoUrl: row.photoUrl,
    photoBase64: (row as unknown as Record<string, unknown>).photoBase64 as string | undefined,
    workEmail: row.workEmail,
  };
}

/**
 * Format an Address into a single-line display string
 */
export function formatAddress(address: string | Record<string, unknown> | undefined | null): string {
  if (!address) return '--';
  if (typeof address === 'string') return address || '--';
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.pinCode,
    address.country,
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Get employee initials from full name (for avatar fallback)
 */
export function getInitials(fullName: string): string {
  if (!fullName) return '??';
  const words = fullName.trim().split(/\s+/);
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

/**
 * Format date string to display format (DD MMM YYYY)
 */
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '--';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Check if a training/cert/document is expiring soon (within 30 days)
 */
export function isExpiringSoon(expiryDate: string | undefined | null, daysThreshold = 30): boolean {
  if (!expiryDate) return false;
  try {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= daysThreshold;
  } catch {
    return false;
  }
}

/**
 * Check if a date has already expired
 */
export function isExpired(expiryDate: string | undefined | null): boolean {
  if (!expiryDate) return false;
  try {
    const expiry = new Date(expiryDate);
    return expiry.getTime() < Date.now();
  } catch {
    return false;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (basic)
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^\+?\d{7,15}$/.test(cleaned);
}

/**
 * Build the create employee request from onboarding draft
 */
export function buildCreateRequest(
  draft: Partial<CreateEmployeeRequest>,
  site: string,
  createdBy: string
): CreateEmployeeRequest {
  return {
    site,
    firstName: draft.firstName || '',
    lastName: draft.lastName || '',
    fullName: `${draft.firstName || ''} ${draft.lastName || ''}`.trim() || undefined,
    workEmail: draft.workEmail || '',
    phone: draft.phone || '',
    title: draft.title || '',
    department: draft.department || '',
    role: draft.role || draft.designation || 'EMPLOYEE',
    location: draft.location,
    businessUnits: draft.businessUnits || [],
    reportingManager: draft.reportingManager,
    designation: draft.designation,
    createdBy,
  };
}

/**
 * Validate onboarding step data.
 * Returns an object of field-level error messages (empty if valid).
 */
export function validateOnboardingStep(
  step: number,
  draft: Partial<CreateEmployeeRequest>
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (step === 0) {
    if (!draft.firstName?.trim()) errors.firstName = 'First name is required';
    if (!draft.lastName?.trim()) errors.lastName = 'Last name is required';
    if (!draft.workEmail?.trim()) {
      errors.workEmail = 'Email is required';
    } else if (!isValidEmail(draft.workEmail)) {
      errors.workEmail = 'Invalid email format';
    }
    if (!draft.phone?.trim()) {
      errors.phone = 'Phone is required';
    } else if (!isValidPhone(draft.phone)) {
      errors.phone = 'Invalid phone format';
    }
  }

  if (step === 1) {
    if (!draft.department?.trim()) errors.department = 'Department is required';
    if (!draft.role?.trim()) errors.role = 'Role is required';
    if (!draft.location?.trim()) errors.location = 'Location is required';
    if (!draft.businessUnits || draft.businessUnits.length === 0) {
      errors.businessUnits = 'At least one business unit is required';
    }
    if (!draft.joiningDate) errors.joiningDate = 'Joining date is required';
  }

  // Step 2 (contact) is optional
  // Step 3 (review) has no additional validation

  return errors;
}

/**
 * Compute statistics from employee profile
 */
export function getProfileStats(profile: EmployeeProfile) {
  return {
    totalSkills: (profile.skills || []).length,
    totalExperience: (profile.previousExperiences || []).length,
    totalEducation: (profile.educationEntries || []).length,
    totalDocuments: (profile.documents || []).length,
    totalAssets: (profile.assetDetails || []).length,
    expiringCerts: (profile.trainingCertifications || []).filter(
      (cert) => isExpiringSoon(cert.validityTo)
    ).length,
    expiredDocs: (profile.documents || []).filter(
      (doc) => isExpired(doc.expiryDate)
    ).length,
  };
}

/**
 * Convert government IDs from array format (API) to object format (UI)
 * Input: [{ idType: "PAN", idNumber: "ABCDE1234F" }]
 * Output: { "PAN": "ABCDE1234F" }
 */
function convertGovtIdsArrayToObject(
  govtIdsArray: Array<{ idType: string; idNumber: string }> | undefined
): Record<string, string> | undefined {
  if (!govtIdsArray || !Array.isArray(govtIdsArray) || govtIdsArray.length === 0) {
    return undefined;
  }
  
  const result: Record<string, string> = {};
  govtIdsArray.forEach((item) => {
    if (item.idType && item.idNumber) {
      result[item.idType] = item.idNumber;
    }
  });
  
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Map backend profile response to our EmployeeProfile type.
 * Backend uses different field names and arrays can be null.
 */
export function mapApiProfileToEmployeeProfile(raw: Record<string, unknown>): EmployeeProfile {
  const basic = (raw.basicDetails || {}) as Record<string, unknown>;
  const official = (raw.officialDetails || {}) as Record<string, unknown>;
  const personal = (raw.personalDetails || {}) as Record<string, unknown>;
  const contact = (raw.contactDetails || {}) as Record<string, unknown>;

  return {
    handle: (raw.handle as string) || '',
    site: (raw.site as string) || '',
    employeeCode: (basic.employeeCode as string) || (official.employeeCode as string) || '',
    basicDetails: {
      fullName: (basic.fullName as string) || '',
      workEmail: (basic.workEmail as string) || '',
      phone: (basic.phone as string) || '',
      photoUrl: (basic.photoUrl as string) || undefined,
      photoBase64: (basic.photoBase64 as string) || undefined,
      status: (basic.status as string) || 'ACTIVE',
      employeeCode: (basic.employeeCode as string) || undefined,
    },
    officialDetails: {
      firstName: (official.firstName as string) || '',
      lastName: (official.lastName as string) || '',
      nickName: (official.nickName as string) || undefined,
      title: (official.title as string) || '',
      department: (official.department as string) || '',
      departmentName: (official.departmentName as string) || undefined,
      role: (official.role as string) || undefined,
      roleName: (official.roleName as string) || undefined,
      designation: (official.role as string) || undefined,
      reportingManager: (official.reportingManager as string) || undefined,
      reportingManagerName: (official.reportingManagerName as string) || undefined,
      employeeCode: (official.employeeCode as string) || undefined,
      location: (official.location as string) || undefined,
      locationName: (official.locationName as string) || undefined,
      businessUnits: (official.businessUnits as string[]) || [],
      businessUnitNames: (official.businessUnitNames as string[]) || undefined,
      joiningDate: (official.joiningDate as string) || undefined,
    },
    personalDetails: {
      dateOfBirth: (personal.dateOfBirth as string) || undefined,
      gender: personal.gender as EmployeeProfile['personalDetails']['gender'],
      maritalStatus: personal.maritalStatus as EmployeeProfile['personalDetails']['maritalStatus'],
      bloodGroup: personal.bloodGroup as EmployeeProfile['personalDetails']['bloodGroup'],
      nationality: (personal.nationality as string) || undefined,
      govtIds: convertGovtIdsArrayToObject(personal.govtIds as Array<{ idType: string; idNumber: string }> || []),
    },
    contactDetails: {
      presentAddress: (contact.presentAddress as string) || undefined,
      permanentAddress: (contact.permanentAddress as string) || undefined,
      city: (contact.city as string) || undefined,
      state: (contact.state as string) || undefined,
      country: (contact.country as string) || undefined,
      pinZip: (contact.pinZip as string) || undefined,
      emergencyContacts: contact.emergencyContacts as EmployeeProfile['contactDetails']['emergencyContacts'] || undefined,
    },
    skills: (raw.skills as EmployeeProfile['skills']) || [],
    jobHistory: (raw.jobHistory as EmployeeProfile['jobHistory']) || [],
    previousExperiences: (raw.previousExperiences as EmployeeProfile['previousExperiences']) || [],
    educationEntries: (raw.educationEntries as EmployeeProfile['educationEntries']) || [],
    trainingCertifications: (raw.trainingCertifications as EmployeeProfile['trainingCertifications']) || [],
    documents: (raw.documents as EmployeeProfile['documents']) || [],
    assetDetails: (raw.assetDetails as EmployeeProfile['assetDetails']) || [],
    remuneration: raw.remuneration as EmployeeProfile['remuneration'] || undefined,
    leaveSummary: raw.leaveSummary as EmployeeProfile['leaveSummary'] || undefined,
    dependents: raw.dependents as EmployeeProfile['dependents'] || undefined,
    visaImmigration: raw.visaImmigration as EmployeeProfile['visaImmigration'] || undefined,
    createdDateTime: (raw.createdDateTime as string) || undefined,
    modifiedDateTime: (raw.modifiedDateTime as string) || undefined,
    // Backward compat aliases for UI components using old property names
    previousExperience: (raw.previousExperiences as EmployeeProfile['previousExperiences']) || [],
    education: (raw.educationEntries as EmployeeProfile['educationEntries']) || [],
    trainingCerts: (raw.trainingCertifications as EmployeeProfile['trainingCertifications']) || [],
    assets: (raw.assetDetails as EmployeeProfile['assetDetails']) || [],
  };
}

/**
 * Transform basic details update to include base64 photo if provided
 * Flattens the payload and includes photoBase64 if image was uploaded
 */
export function buildUpdateBasicPayload(
  site: string,
  handle: string,
  basicData: Record<string, unknown>,
  modifiedBy: string
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    site,
    handle,
    fullName: basicData.fullName || undefined,
    phone: basicData.phone || undefined,
    modifiedBy,
  };

  // Include photoBase64 if provided (from image upload)
  if (basicData.photoBase64) {
    payload.photoBase64 = basicData.photoBase64;
  }

  return payload;
}

/**
 * Transform contact details from nested structure to flat payload for API
 * Input: { presentAddress, permanentAddress, city, state, country, pinZip, emergencyContacts }
 * Output: Flat structure with all fields at top level
 */
export function buildUpdateContactPayload(
  site: string,
  handle: string,
  contactData: Record<string, unknown>,
  modifiedBy: string
): Record<string, unknown> {
  return {
    site,
    handle,
    presentAddress: contactData.presentAddress || undefined,
    permanentAddress: contactData.permanentAddress || undefined,
    city: contactData.city || undefined,
    state: contactData.state || undefined,
    country: contactData.country || undefined,
    pinZip: contactData.pinZip || undefined,
    emergencyContacts: contactData.emergencyContacts || undefined,
    modifiedBy,
  };
}

/**
 * Transform personal details to API payload format
 * Converts govtIds object to array format with idType, idNumber, verified fields
 */
export function buildUpdatePersonalPayload(
  site: string,
  handle: string,
  personalData: Record<string, unknown>,
  modifiedBy: string
): Record<string, unknown> {
  // Convert govtIds object to array format if provided
  const govtIdsArray: Array<{ idType: string; idNumber: string; verified?: boolean }> = [];
  if (personalData.govtIds && typeof personalData.govtIds === 'object') {
    Object.entries(personalData.govtIds).forEach(([idType, idNumber]) => {
      if (idType && idNumber) {
        govtIdsArray.push({
          idType,
          idNumber: idNumber as string,
          verified: false, // Default to false, can be updated from API response
        });
      }
    });
  }

  return {
    site,
    handle,
    dateOfBirth: personalData.dateOfBirth || undefined,
    gender: personalData.gender || undefined,
    maritalStatus: personalData.maritalStatus || undefined,
    bloodGroup: personalData.bloodGroup || undefined,
    nationality: personalData.nationality || undefined,
    govtIds: govtIdsArray.length > 0 ? govtIdsArray : undefined,
    modifiedBy,
  };
}
