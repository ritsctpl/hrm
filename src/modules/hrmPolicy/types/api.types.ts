import { PolicyDocType, PolicyStatus } from "./domain.types";

export interface GetPoliciesPayload {
  site: string;
  categoryId?: string;
  docType?: PolicyDocType;
  status?: PolicyStatus;
  searchText?: string;
  page?: number;
  size?: number;
}

export interface GetPolicyDetailPayload {
  site: string;
  policyId: string;
  employeeId?: string;
}

export interface AcknowledgePolicyPayload {
  site: string;
  policyId: string;
  employeeId: string;
  version: string;
}

export interface CreatePolicyPayload {
  site: string;
  title: string;
  docType: PolicyDocType;
  categoryId: string;
  content?: string;
  summary?: string;
  effectiveDate: string;
  nextReviewDate?: string;
  tags?: string[];
  relatedDocumentIds?: string[];
}

export interface UpdatePolicyPayload extends Partial<CreatePolicyPayload> {
  policyId: string;
}

export interface PolicyActionPayload {
  site: string;
  policyId: string;
  comment?: string;
}

export interface GetVersionHistoryPayload {
  site: string;
  policyId: string;
}

export interface GetAcknowledgmentReportPayload {
  site: string;
  policyId: string;
}

export interface SendReminderPayload {
  site: string;
  policyId: string;
  targetStatus: "PENDING" | "OVERDUE";
}

export interface SubmitForReviewPayload {
  site: string;
  handle: string;
  submittedBy: string;
}

export interface ApprovePolicyPayload {
  site: string;
  handle: string;
  approvedBy: string;
  comments?: string;
}

export interface RetirePolicyPayload {
  site: string;
  handle: string;
  retiredBy: string;
  reason: string;
}

export interface SupersedePolicyPayload {
  site: string;
  handle: string;
  newHandle: string;
  supersededBy: string;
}

export interface DeletePolicyPayload {
  site: string;
  handle: string;
  deletedBy: string;
}

export interface GetMyPoliciesPayload {
  site: string;
  employeeId: string;
}

export interface GetEmployeeAcknowledgmentsPayload {
  site: string;
  policyHandle: string;
}

export interface CreateCategoryPayload {
  site: string;
  name: string;
  description?: string;
}
