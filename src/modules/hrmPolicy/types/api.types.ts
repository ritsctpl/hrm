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
