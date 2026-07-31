/**
 * Priority drives approval routing, forced acknowledgement and the emergency
 * path — it is no longer just a coloured chip (handover §0 rule 3).
 *
 * The backend accepts the legacy values on write and folds them
 * (NORMAL→GENERAL, HIGH→IMPORTANT, URGENT→CRITICAL), but **responses always
 * return the new values**. Legacy members are kept in the union only so old
 * cached payloads still typecheck; use `normalizePriority` before matching.
 */
export type AnnouncementPriority =
  | "GENERAL"
  | "IMPORTANT"
  | "CRITICAL"
  | "EMERGENCY"
  /** @deprecated legacy — folded by the server on write */
  | "NORMAL"
  /** @deprecated legacy */
  | "HIGH"
  /** @deprecated legacy */
  | "URGENT";

export type CanonicalAnnouncementPriority = "GENERAL" | "IMPORTANT" | "CRITICAL" | "EMERGENCY";
export type AnnouncementCategory =
  | "GENERAL"
  | "HOLIDAY"
  | "POLICY_UPDATE"
  | "TRAINING"
  | "EVENT"
  | "EMERGENCY"
  | "BENEFITS"
  | "FACILITIES";
/** `RETURNED` sits alongside DRAFT/REJECTED as an editable state (handover §1). */
export type AnnouncementStatus =
  | "DRAFT"
  | "RETURNED"
  | "REJECTED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "WITHDRAWN"
  | "EXPIRED";

export interface AnnouncementAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  /** Optional — the size label is hidden when the backend omits it. */
  fileSizeBytes?: number;
}

export interface Announcement {
  handle: string;
  announcementId: string;
  site?: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  pinToTop: boolean;
  isRead?: boolean;
  publishedAt?: string;
  scheduledPublishAt?: string;
  expiresAt?: string;
  totalTargetEmployees?: number;
  readCount?: number;
  readRate?: number;
  attachments?: AnnouncementAttachment[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  messageDetails?: unknown;

  // ── approval routing (handover §5) ──
  approvalChain?: ApprovalChainEntry[];
  /** null once the chain is finished or never started. */
  currentLevel?: number | null;
  nextApprovers?: string[];
  approvalRequired?: boolean;
  acknowledgmentRequired?: boolean;

  returnedBy?: string;
  returnedAt?: string;
  returnReason?: string;

  emergencyPublish?: boolean;
  ratificationStatus?: "PENDING" | "RATIFIED" | "REFUSED" | null;
  ratificationDeadline?: string;
  ratifiedBy?: string;
  ratifiedAt?: string;
}

export type ApprovalStepStatus = "PENDING" | "APPROVED" | "REJECTED" | "RETURNED" | "SKIPPED";

/** Mirrors the backend `ApprovalChainEntry` model. */
export interface ApprovalChainEntry {
  level: number;
  levelCode: string;
  /** e.g. ANNOUNCEMENT_APPROVE_L1 — gates whether the user may action this rung. */
  requiredPermission: string;
  approverIds?: string[];
  status: ApprovalStepStatus;
  actedBy?: string;
  actedAt?: string;
  remarks?: string;
  deadline?: string;
  escalated?: boolean;
  reminderCount?: number;
  skipReason?: string;
}

/** Mirrors the backend `EngagementResponse` DTO. */
export interface EngagementStats {
  announcementHandle: string;
  announcementId: string;
  title: string;
  status: AnnouncementStatus;
  publishedAt?: string;

  totalTargetEmployees: number;
  deliveredCount?: number;
  readCount: number;
  unreadCount?: number;
  readRate: number;

  acknowledgmentRequired?: boolean;
  acknowledgedCount?: number;
  pendingAcknowledgmentCount?: number;
  overdueAcknowledgmentCount?: number;
  acknowledgmentRate?: number;

  emailSentCount?: number;
  emailFailedCount?: number;
  emailNoAddressCount?: number;
  emailPendingCount?: number;

  readByDepartment?: Record<string, number>;
}
