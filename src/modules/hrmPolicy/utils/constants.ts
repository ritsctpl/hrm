import { PolicyDocType, PolicyStatus } from "../types/domain.types";

export const POLICY_DOC_TYPE_COLORS: Record<PolicyDocType, string> = {
  POLICY: "blue",
  SOP: "green",
  REGULATION: "purple",
  GUIDELINE: "orange",
  CODE_OF_CONDUCT: "red",
};

export const POLICY_STATUS_COLORS: Record<PolicyStatus, string> = {
  DRAFT: "default",
  REVIEW: "processing",
  APPROVED: "cyan",
  PUBLISHED: "success",
  RETIRED: "warning",
  SUPERSEDED: "error",
};

export const POLICY_DOC_TYPE_LABELS: Record<PolicyDocType, string> = {
  POLICY: "Policy",
  SOP: "SOP",
  REGULATION: "Regulation",
  GUIDELINE: "Guideline",
  CODE_OF_CONDUCT: "Code of Conduct",
};

export const POLICY_STATUS_LABELS: Record<PolicyStatus, string> = {
  DRAFT: "Draft",
  REVIEW: "Under Review",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  RETIRED: "Retired",
  SUPERSEDED: "Superseded",
};

// Temporarily allow all roles including EMPLOYEE until RBAC is implemented
export const POLICY_HR_ROLES = ["HR", "HR_MANAGER", "HR_ADMIN", "ADMIN", "SUPERADMIN", "MANAGER", "EMPLOYEE"];

export const PAGE_SIZE = 20;
