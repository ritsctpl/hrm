import {
  AnnouncementPriority,
  CanonicalAnnouncementPriority,
  AnnouncementStatus,
} from "../types/domain.types";

/** Legacy → canonical, matching the server's write-time fold (handover §1). */
const LEGACY_PRIORITY: Record<string, CanonicalAnnouncementPriority> = {
  NORMAL: "GENERAL",
  HIGH: "IMPORTANT",
  URGENT: "CRITICAL",
  // Seeded category defaults still carry LOW even though it was never a
  // priority the UI offered.
  LOW: "GENERAL",
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

// The approval-policy resolver options lived here. They are gone with the
// policy engine: approval routes to the author's reporting manager and
// escalates up the chain, so there is nothing to resolve or configure. The
// per-category SLA / delegation config is read server-side only — no endpoint
// exposes it, so an admin screen would have nothing to point at.

/** Statuses the author may still edit (handover §1 item 3). */
export const EDITABLE_STATUSES: AnnouncementStatus[] = ["DRAFT", "RETURNED", "REJECTED"];

/**
 * Statuses that may be deleted, mirroring the server's `AnnouncementStatus.DELETABLE`.
 *
 * Kept identical to the server set — no wider, no narrower. Offering delete on a status the
 * server refuses turns a disabled control into a failed request, and hiding it on one the
 * server allows leaves the author with a draft they cannot get rid of, which is the whole of
 * CT-2026-477's second complaint. Once published, an announcement is a permanent record and is
 * withdrawn rather than deleted.
 */
export const DELETABLE_STATUSES: AnnouncementStatus[] = ["DRAFT", "REJECTED", "RETURNED"];

export const isDeletableStatus = (status?: string): boolean =>
  DELETABLE_STATUSES.includes(status as AnnouncementStatus);

export const ANNOUNCEMENT_HR_ROLES = ["HR", "HR_MANAGER", "ADMIN", "SUPERADMIN"];

