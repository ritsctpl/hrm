import { PolicyDocType, PolicyStatus } from "../types/domain.types";

export const POLICY_DOC_TYPE_COLORS: Record<PolicyDocType, string> = {
  POLICY: "blue",
  SOP: "green",
  REFERENCE: "purple",
  HANDBOOK: "orange",
};

export const POLICY_STATUS_COLORS: Record<PolicyStatus, string> = {
  DRAFT: "default",
  PUBLISHED: "success",
  ARCHIVED: "warning",
};

export const POLICY_DOC_TYPE_LABELS: Record<PolicyDocType, string> = {
  POLICY: "Policy",
  SOP: "SOP",
  REFERENCE: "Reference",
  HANDBOOK: "Handbook",
};

export const POLICY_STATUS_LABELS: Record<PolicyStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export const POLICY_HR_ROLES = ["HR", "HR_MANAGER", "ADMIN", "SUPERADMIN"];

export const PAGE_SIZE = 20;
