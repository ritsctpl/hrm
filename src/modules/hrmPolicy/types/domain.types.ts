export type PolicyDocType = "POLICY" | "SOP" | "REGULATION" | "GUIDELINE" | "CODE_OF_CONDUCT";
export type PolicyStatus = "DRAFT" | "REVIEW" | "APPROVED" | "PUBLISHED" | "RETIRED" | "SUPERSEDED";
export type AckStatus = "ACKNOWLEDGED" | "PENDING" | "OVERDUE" | "WAIVED";
export type ContentType = "TEXT" | "FILE";
export type AcknowledgmentFrequency = "ONE_TIME" | "ANNUAL" | "ON_REVISION";

export interface PolicyCategory {
  handle: string;
  site: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  iconName?: string;
  color?: string;
  displayOrder?: number;
  active?: number;
  createdDateTime?: string;
  createdBy?: string;
  modifiedDateTime?: string;
  modifiedBy?: string;
}

export interface PolicyVersion {
  versionNumber: string;
  publishedAt: string;
  changesDescription: string;
  publishedBy: string;
  fileUrl?: string;
}

export interface PolicyAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize?: number;
}

export interface PolicyDocument {
  handle: string;
  site: string;
  policyCode: string;
  policyNumber?: string;
  title: string;
  description?: string;
  documentType: PolicyDocType;
  categoryHandle: string;
  categoryName?: string;
  currentVersion: string;
  status: PolicyStatus;
  contentType?: ContentType;
  textContent?: string;
  fileHandle?: string;
  fileName?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  reviewDate?: string;
  expiryDate?: string;
  acknowledgmentRequired?: boolean;
  acknowledgmentFrequency?: AcknowledgmentFrequency;
  acknowledgmentDeadlineDays?: string;
  totalApplicableEmployees?: number;
  acknowledgedCount?: number;
  acknowledgmentRate?: number;
  tags?: string[];
  attachments?: PolicyAttachment[];
  relatedPolicies?: { handle: string; title: string }[];
  applicableDepartments?: string[];
  applicableBusinessUnits?: string[];
  applicableRoles?: string[];
  allEmployees?: boolean;
  reviewerId?: string;
  approverId?: string;
  publishedDateTime?: string;
  publishedBy?: string;
  createdBy?: string;
  messageDetails?: unknown;
}

export interface AcknowledgmentRecord {
  handle?: string;
  policyHandle?: string;
  policyTitle?: string;
  policyVersion?: string;
  employeeId: string;
  employeeName?: string;
  department?: string;
  status: AckStatus;
  dueDate?: string;
  acknowledgedDate?: string;
  acknowledgedVia?: string;
}

export interface AcknowledgmentReport {
  policyHandle: string;
  policyTitle?: string;
  policyVersion?: string;
  totalApplicable: number;
  acknowledged: number;
  pending: number;
  overdue: number;
  waived?: number;
  acknowledgmentRate: number;
  records: AcknowledgmentRecord[];
}

export interface PolicyCycle {
  id: string;
  site: string;
  name: string;
  description?: string;
  reviewFrequencyMonths: number;
  nextReviewDate: string;
  policyIds: string[];
  isActive: boolean;
}

export interface EmployeePolicyPortal {
  employeeId: string;
  publishedPolicies: PolicyDocument[];
  pendingAcknowledgments: AcknowledgmentRecord[];
  completedAcknowledgments: AcknowledgmentRecord[];
  totalPolicies: number;
  acknowledgedCount: number;
  pendingCount: number;
}
