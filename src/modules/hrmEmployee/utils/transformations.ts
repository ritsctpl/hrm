/**
 * HRM Employee Data Transformations
 * Utility functions for formatting, mapping, and validating employee data
 */

import type { EmployeeSummary, Address, EmployeeProfile } from '../types/domain.types';
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
    designation: row.designation,
    status: row.status,
    photoUrl: row.photoUrl,
    workEmail: row.workEmail,
  };
}

/**
 * Format an Address into a single-line display string
 */
export function formatAddress(address: Address | undefined | null): string {
  if (!address) return '--';
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
    workEmail: draft.workEmail || '',
    phone: draft.phone || '',
    title: draft.title || '',
    department: draft.department || '',
    designation: draft.designation || '',
    businessUnits: draft.businessUnits || [],
    joiningDate: draft.joiningDate || new Date().toISOString().split('T')[0],
    reportingManager: draft.reportingManager,
    presentAddress: draft.presentAddress,
    permanentAddress: draft.permanentAddress,
    emergencyContacts: draft.emergencyContacts,
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
    if (!draft.designation?.trim()) errors.designation = 'Designation is required';
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
    totalSkills: profile.skills.length,
    totalExperience: profile.previousExperience.length,
    totalEducation: profile.education.length,
    totalDocuments: profile.documents.length,
    totalAssets: profile.assets.length,
    expiringCerts: profile.trainingCerts.filter(
      (cert) => isExpiringSoon(cert.expiryDate)
    ).length,
    expiredDocs: profile.documents.filter(
      (doc) => isExpired(doc.expiryDate)
    ).length,
  };
}
