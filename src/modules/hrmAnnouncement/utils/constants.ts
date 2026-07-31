import {
  AnnouncementPriority,
  CanonicalAnnouncementPriority,
  AnnouncementCategory,
  AnnouncementStatus,
} from "../types/domain.types";

/** Legacy → canonical, matching the server's write-time fold (handover §1). */
const LEGACY_PRIORITY: Record<string, CanonicalAnnouncementPriority> = {
  NORMAL: "GENERAL",
  HIGH: "IMPORTANT",
  URGENT: "CRITICAL",
};

/**
 * Responses always carry the canonical value, but cached or in-flight legacy
 * data would otherwise miss every colour/label lookup. Normalize before match.
 */
export const normalizePriority = (
  priority?: AnnouncementPriority | string
): CanonicalAnnouncementPriority =>
  (LEGACY_PRIORITY[priority ?? ""] ?? (priority as CanonicalAnnouncementPriority) ?? "GENERAL");

export const PRIORITY_COLORS: Record<CanonicalAnnouncementPriority, string> = {
  GENERAL: "default",
  IMPORTANT: "orange",
  CRITICAL: "red",
  EMERGENCY: "magenta",
};

export const PRIORITY_LABELS: Record<CanonicalAnnouncementPriority, string> = {
  GENERAL: "General",
  IMPORTANT: "Important",
  CRITICAL: "Critical",
  EMERGENCY: "Emergency",
};

/** Acknowledgement is forced on by the server for these (handover §1 item 6). */
export const FORCED_ACK_PRIORITIES: CanonicalAnnouncementPriority[] = ["CRITICAL", "EMERGENCY"];

export const CATEGORY_COLORS: Record<AnnouncementCategory, string> = {
  GENERAL: "default",
  HOLIDAY: "blue",
  POLICY_UPDATE: "geekblue",
  TRAINING: "gold",
  EVENT: "purple",
  EMERGENCY: "red",
  BENEFITS: "green",
  FACILITIES: "cyan",
};

export const STATUS_COLORS: Record<AnnouncementStatus, string> = {
  DRAFT: "default",
  RETURNED: "gold",
  REJECTED: "error",
  PENDING_APPROVAL: "processing",
  APPROVED: "cyan",
  SCHEDULED: "processing",
  PUBLISHED: "success",
  WITHDRAWN: "warning",
  EXPIRED: "error",
};

export const STATUS_LABELS: Record<AnnouncementStatus, string> = {
  DRAFT: "Draft",
  RETURNED: "Returned for Edit",
  REJECTED: "Rejected",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  WITHDRAWN: "Withdrawn",
  EXPIRED: "Expired",
};

// ── Approval policy admin (handover §6.5) ──────────────────────────────────

export const RESOLVER_TYPES = [
  { value: "PERMISSION", label: "Permission", hint: "A permission code, e.g. ANNOUNCEMENT_APPROVE_L1" },
  { value: "ROLE", label: "Role", hint: "A role code" },
  { value: "DESIGNATION", label: "Designation", hint: "A designation name" },
  { value: "EMPLOYEE_LIST", label: "Employee list", hint: "Comma-separated employee codes" },
  { value: "ORG_HIERARCHY_TOP", label: "Org hierarchy — top", hint: "Resolved from the org tree" },
];

/** Only this resolver needs no value; every other type requires one. */
export const RESOLVER_WITHOUT_VALUE = "ORG_HIERARCHY_TOP";

export const ON_BREACH_OPTIONS = [
  { value: "REMIND", label: "Remind" },
  { value: "ESCALATE", label: "Escalate" },
  { value: "AUTO_APPROVE", label: "Auto-approve" },
];

export const ON_EMPTY_OPTIONS = [
  { value: "FAIL", label: "Fail" },
  { value: "ESCALATE", label: "Escalate" },
];

/** Statuses the author may still edit (handover §1 item 3). */
export const EDITABLE_STATUSES: AnnouncementStatus[] = ["DRAFT", "RETURNED", "REJECTED"];

export const ANNOUNCEMENT_HR_ROLES = ["HR", "HR_MANAGER", "ADMIN", "SUPERADMIN"];

export const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  GENERAL: "General",
  HOLIDAY: "Holiday",
  POLICY_UPDATE: "Policy Update",
  TRAINING: "Training",
  EVENT: "Event",
  EMERGENCY: "Emergency",
  BENEFITS: "Benefits",
  FACILITIES: "Facilities",
};
