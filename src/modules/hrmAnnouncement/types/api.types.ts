import { AnnouncementPriority, AnnouncementCategory, AnnouncementStatus } from "./domain.types";

/**
 * Mirrors `MyAnnouncementsRequest`. Note `category` and `priority` are ARRAYS
 * server-side — sending a bare string fails Jackson deserialization and comes
 * back as a 500. There is no `status` field: the feed is published-only by
 * definition, filtered by audience rather than by status.
 */
export interface GetAnnouncementsPayload {
  organizationId: string;
  /** Employee CODE. Either key is accepted; blank means no audience match. */
  employeeCode?: string;
  employeeId?: string;
  category?: string[];
  priority?: string[];
  text?: string;
  year?: number;
  includePast?: boolean;
  unreadOnly?: boolean;
  pendingAcknowledgmentOnly?: boolean;
  page?: number;
  size?: number;
}

/** Mirrors `AnnouncementSearchRequest` — status/category/priority are arrays. */
export interface ListAnnouncementsPayload {
  organizationId: string;
  text?: string;
  status?: string[];
  category?: string[];
  priority?: string[];
  createdBy?: string;
  year?: number;
  acknowledgmentRequired?: boolean;
  pinnedOnly?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  includeFacets?: boolean;
  /** REQUIRED since 2026-07-31 — needs CREATE, MANAGE or REPORT. */
  actorId: string;
}

/** `/getPinned` resolves the employee from `employeeCode` (or `employeeId`). */
export interface GetPinnedAnnouncementsPayload {
  organizationId: string;
  employeeCode: string;
}

export interface GetAnnouncementDetailPayload {
  organizationId: string;
  announcementHandle: string;
  /**
   * REQUIRED — `/get` is audience-scoped (handover §1 item 1). Without an
   * identity to scope against the server returns 404, not a redacted record.
   */
  actorId: string;
}

/** Mirrors `AnnouncementReadRequest`. `via` — not `readVia`. */
export interface MarkReadPayload {
  organizationId: string;
  announcementHandle: string;
  /** Either key is accepted server-side; prefer the code. */
  employeeCode?: string;
  employeeId?: string;
  via?: string;
}

export interface CreateAnnouncementPayload {
  organizationId: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority?: AnnouncementPriority;
  scheduledPublishAt?: string;
  expiresAt?: string;
  allEmployees?: boolean;
  targetDepartments?: string[];
  targetBusinessUnits?: string[];
  targetRoles?: string[];
  targetEmployeeIds?: string[];
  sendEmailNotification?: boolean;
  sendPushNotification?: boolean;
  pinToTop?: boolean;
  /** Server forces this on for CRITICAL/EMERGENCY regardless of what is sent. */
  acknowledgmentRequired?: boolean;
  pinnedUntil?: string;
  /**
   * REQUIRED in practice — the server resolves the actor for the CREATE
   * permission check from this field, not from a header or token. Must be the
   * employee code; omitting it yields 403 PERMISSION_DENIED.
   */
  createdBy?: string;
}

export interface UpdateAnnouncementPayload extends Partial<CreateAnnouncementPayload> {
  organizationId: string;
  announcementHandle: string;
  /** REQUIRED — actor for the EDIT permission check. */
  modifiedBy?: string;
}

/** `/publish` takes an AnnouncementActionRequest — the actor is `actorId`. */
export interface PublishAnnouncementPayload {
  organizationId: string;
  announcementHandle: string;
  actorId: string;
}

/** `/withdraw` is an AnnouncementActionRequest too: `actorId` + `remarks`. */
export interface WithdrawAnnouncementPayload {
  organizationId: string;
  announcementHandle: string;
  actorId: string;
  remarks?: string;
}

/** `/delete` reads `announcementHandle` and `deletedBy` — not announcementId. */
export interface DeleteAnnouncementPayload {
  organizationId: string;
  announcementHandle: string;
  deletedBy: string;
}

export interface GetEngagementPayload {
  organizationId: string;
  announcementHandle: string;
  /** REQUIRED since 2026-07-31 — needs REPORT or MANAGE. */
  actorId: string;
}

export interface GetPinnedPayload {
  organizationId: string;
}

/**
 * Mirrors `AnnouncementCategory`. Categories are per-site Mongo records, not a
 * fixed enum — always read them from `/category/list` rather than hardcoding,
 * or a site with a custom category can't select it.
 */
export interface AnnouncementCategoryRecord {
  handle?: string;
  site?: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  iconName?: string;
  color?: string;
  displayOrder?: number;
  approvalRequired?: boolean;
  acknowledgmentRequiredDefault?: boolean;
  defaultAcknowledgmentDays?: number;
  emailByDefault?: boolean;
  pushByDefault?: boolean;
  defaultPriority?: string;
  systemDefined?: boolean;
}

/** Mirrors `ResolveAudienceRequest`. Empty targeting matches nobody. */
export interface PreviewAudiencePayload {
  organizationId: string;
  allEmployees?: boolean;
  targetDepartments?: string[];
  targetBusinessUnits?: string[];
  targetRoles?: string[];
  targetEmployeeIds?: string[];
}

/** Mirrors `AudienceResolution`. */
export interface AudienceResolution {
  totalTargetEmployees: number;
  withEmailCount: number;
  withoutEmailCount: number;
  sampleRecipients?: {
    employeeCode: string;
    employeeName: string;
    workEmailMasked: string;
  }[];
}

/**
 * Shared action body.
 *
 * There is no level token to send: with one approver at a time the server's
 * compare-and-set guards on status alone, so two approvers racing still
 * resolves deterministically — the loser gets 409 HRM_ANN_NOT_PENDING_APPROVAL.
 */
export interface AnnouncementActionPayload {
  organizationId: string;
  announcementHandle: string;
  actorId: string;
  remarks?: string;
  emergencyJustification?: string;
  ratified?: boolean;
}
