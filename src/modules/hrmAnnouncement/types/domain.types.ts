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
  | "URGENT"
  /** @deprecated legacy — seeded category defaults still carry this */
  | "LOW";

export type CanonicalAnnouncementPriority = "GENERAL" | "IMPORTANT" | "CRITICAL" | "EMERGENCY";

/**
 * Category codes are per-site Mongo records, not a fixed set — a site can
 * define its own. Kept as a plain string so adding one server-side needs no
 * frontend change; read the list from `/category/list`.
 */
export type AnnouncementCategory = string;
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
  /**
   * What the feed endpoints call the same value — they answer from the
   * delivery record. The service normalizes it onto `handle`; keep reading
   * `handle` everywhere else.
   */
  announcementHandle?: string;
  announcementId: string;
  /** Plain-text extract the server keeps for list views. */
  summary?: string;
  /** "HTML" or "PLAIN" — decides how `content` may be rendered. */
  contentFormat?: string;
  site?: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  pinToTop: boolean;
  isRead?: boolean;
  readAt?: string;

  /**
   * Per-employee acknowledgement state. Only `/getMyAnnouncements` and
   * `/getPinned` return these — `/get` carries the announcement-level
   * aggregate counts instead, so never expect them from the detail call.
   */
  acknowledgmentRequired?: boolean;
  isAcknowledged?: boolean;
  acknowledgedAt?: string;
  acknowledgmentDueDate?: string;
  acknowledgmentOverdue?: boolean;

  /** A withdrawn announcement stays visible with its reason. */
  withdrawn?: boolean;
  withdrawalReason?: string;
  past?: boolean;
  /** Why this employee matched the audience — useful when targeting is broad. */
  matchReason?: string;
  publishedAt?: string;
  /** Who pressed publish — often, but not always, the author. */
  publishedBy?: string;
  scheduledPublishAt?: string;
  expiresAt?: string;
  totalTargetEmployees?: number;
  readCount?: number;
  readRate?: number;
  attachments?: AnnouncementAttachment[];
  createdAt?: string;
  /** What the server actually sends — `createdAt` is only on cached payloads. */
  createdDateTime?: string;
  updatedAt?: string;
  createdBy?: string;
  messageDetails?: unknown;

  // ── approval routing ──
  /**
   * One approver at a time, exactly like a leave request: the author's
   * reporting manager holds it, an unanswered request escalates up the
   * reporting chain, and HR catches anything that runs off the top.
   *
   * Null once the decision is made, or before submission.
   */
  currentApproverId?: string;
  /**
   * The first approver it was routed to. Retained after escalation moves the
   * item on, so the original manager keeps visibility — render it as context
   * ("Originally with R20002"), never as an actionable step.
   */
  supervisorId?: string;
  /** 0 with the first approver; each SLA breach that escalates adds one. */
  escalationLevel?: number;
  slaDeadline?: string;
  /**
   * true ⇒ the SLA lapsed with nowhere left to escalate (already with HR, or
   * no HR configured). The item is stalled, not moving — surface it.
   */
  slaBreached?: boolean;
  /** Always single-element; mirrors `currentApproverId`. */
  nextApprovers?: string[];
  approvalRequired?: boolean;
  submittedBy?: string;
  submittedAt?: string;

  // ── audience targeting (additive; allEmployees overrides the rest) ──
  allEmployees?: boolean;
  targetBusinessUnits?: string[];
  targetDepartments?: string[];
  targetRoles?: string[];
  targetEmployeeIds?: string[];

  // ── the decision, once one has been made ──
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  returnedBy?: string;
  returnedAt?: string;
  returnReason?: string;

  emergencyPublish?: boolean;
  ratificationStatus?: "PENDING" | "RATIFIED" | "REFUSED" | null;
  ratificationDeadline?: string;
  ratifiedBy?: string;
  ratifiedAt?: string;
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
