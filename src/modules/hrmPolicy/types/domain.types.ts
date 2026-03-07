export type PolicyDocType = "POLICY" | "SOP" | "REFERENCE" | "HANDBOOK";
export type PolicyStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type AckStatus = "REQUIRED" | "ACKNOWLEDGED" | "OVERDUE" | "NONE";

export interface PolicyCategory {
  id: string;
  site: string;
  name: string;
  description?: string;
  documentCount?: number;
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
  id: string;
  site: string;
  title: string;
  docType: PolicyDocType;
  status: PolicyStatus;
  categoryId: string;
  categoryName?: string;
  currentVersion: string;
  effectiveDate: string;
  nextReviewDate?: string;
  owner?: string;
  approvedBy?: string;
  approvedAt?: string;
  summary?: string;
  content?: string;
  tags?: string[];
  attachments?: PolicyAttachment[];
  relatedDocumentIds?: string[];
  relatedDocuments?: { id: string; title: string }[];
  ackStatus?: AckStatus;
  acknowledgedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AcknowledgmentRecord {
  employeeId: string;
  employeeName: string;
  department?: string;
  ackStatus: AckStatus;
  acknowledgedAt?: string;
}

export interface AcknowledgmentReport {
  policyId: string;
  totalRequired: number;
  acknowledged: number;
  pending: number;
  overdue: number;
  percentage: number;
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
