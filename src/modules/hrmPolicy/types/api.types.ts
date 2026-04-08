import { PolicyDocType, PolicyStatus, ContentType, AcknowledgmentFrequency } from "./domain.types";

export interface GetPoliciesPayload {
  site: string;
  status?: PolicyStatus;
  documentType?: PolicyDocType;
  categoryHandle?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface GetPolicyDetailPayload {
  site: string;
  policyHandle: string;
}

export interface GetPolicyByCodePayload {
  site: string;
  policyCode: string;
}

export interface AcknowledgePolicyPayload {
  site: string;
  policyHandle: string;
  employeeId: string;
  acknowledgedVia: "WEB" | "MOBILE" | "EMAIL";
  ipAddress?: string;
  userAgent?: string;
}

export interface WaiveAcknowledgmentPayload {
  site: string;
  policyHandle: string;
  employeeId: string;
  waivedBy: string;
  waivedReason: string;
}

export interface CreatePolicyPayload {
  site: string;
  title: string;
  description?: string;
  documentType: PolicyDocType;
  categoryHandle: string;
  contentType?: ContentType;
  textContent?: string;
  pdfBase64?: string;
  versionNumber?: string;
  changeDescription?: string;
  reviewerId?: string;
  approverId?: string;
  reviewDate?: string;
  expiryDate?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  applicableDepartments?: string[];
  applicableBusinessUnits?: string[];
  applicableRoles?: string[];
  allEmployees?: boolean;
  acknowledgmentRequired?: boolean;
  acknowledgmentDeadlineDays?: string;
  acknowledgmentFrequency?: AcknowledgmentFrequency;
  tags?: string[];
  relatedPolicies?: { handle: string }[];
  createdBy?: string;
}

export interface UpdatePdfPayload {
  site: string;
  policyHandle: string;
  fileName: string;
  pdfBase64: string;
  updatedBy: string;
}

export interface UpdatePolicyPayload extends Partial<CreatePolicyPayload> {
  policyHandle: string;
}

export interface PublishPolicyPayload {
  site: string;
  policyHandle: string;
  publishedBy: string;
  scheduledPublishDate?: string;
}

export interface SubmitForReviewPayload {
  site: string;
  policyHandle: string;
  submittedBy: string;
}

export interface ApprovePolicyPayload {
  site: string;
  policyHandle: string;
  approvedBy: string;
  approverComments?: string;
}

export interface RetirePolicyPayload {
  site: string;
  policyHandle: string;
  retiredBy: string;
  reason: string;
}

export interface SupersedePolicyPayload {
  site: string;
  oldPolicyHandle: string;
  newPolicyHandle: string;
  updatedBy: string;
}

export interface DeletePolicyPayload {
  site: string;
  policyHandle: string;
  deletedBy: string;
}

export interface GetVersionHistoryPayload {
  site: string;
  policyHandle: string;
}

export interface GetAcknowledgmentReportPayload {
  site: string;
  policyHandle: string;
}

export interface GetEmployeeAcknowledgmentsPayload {
  site: string;
  employeeId: string;
}

export interface GetMyPoliciesPayload {
  site: string;
  employeeId: string;
  department?: string;
  role?: string;
}

export interface GetEmployeePolicyPortalPayload {
  site: string;
  employeeId: string;
  department?: string;
}

export interface CreateCategoryPayload {
  site: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  iconName?: string;
  color?: string;
  displayOrder?: number;
  createdBy?: string;
}

export interface UpdateCategoryPayload {
  site: string;
  categoryId: string;
  name?: string;
  description?: string;
  modifiedBy?: string;
}

export interface DeleteCategoryPayload {
  site: string;
  categoryId: string;
  deletedBy: string;
}

export interface DownloadPolicyFilePayload {
  site: string;
  policyId: string;
  version?: string;
}
