import { AnnouncementPriority, AnnouncementCategory, AnnouncementStatus } from "./domain.types";

export interface GetAnnouncementsPayload {
  organizationId: string;
  employeeId?: string;
  department?: string;
  role?: string;
  category?: AnnouncementCategory;
  priority?: AnnouncementPriority;
  status?: AnnouncementStatus;
  page?: number;
  size?: number;
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

export interface ListAnnouncementsPayload {
  organizationId: string;
  status?: string;
  category?: string;
  page?: number;
  size?: number;
}

export interface MarkReadPayload {
  organizationId: string;
  announcementHandle: string;
  employeeId: string;
  readVia?: string;
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
  createdBy?: string;
}

export interface UpdateAnnouncementPayload extends Partial<CreateAnnouncementPayload> {
  organizationId: string;
  announcementHandle: string;
}

export interface PublishAnnouncementPayload {
  organizationId: string;
  announcementHandle: string;
  publishedBy?: string;
}

export interface WithdrawAnnouncementPayload {
  organizationId: string;
  announcementHandle: string;
  withdrawnBy?: string;
  reason?: string;
}

export interface DeleteAnnouncementPayload {
  organizationId: string;
  announcementId: string;
  deletedBy: string;
}

export interface GetEngagementPayload {
  organizationId: string;
  announcementHandle: string;
}

export interface GetPinnedPayload {
  organizationId: string;
}

/** `/policy/previewRoute` — what the composer renders (handover §4.4). */
export interface PreviewRoutePayload {
  organizationId: string;
  priority: string;
  actorId: string;
}

export interface ApprovalRouteLevel {
  level: number;
  levelCode: string;
  resolverType: string;
  slaHours: number;
  approverIds: string[];
  /** false ⇒ submission will fail with 422 APPROVER_NOT_CONFIGURED. */
  resolvable: boolean;
}

export interface ApprovalRoutePreview {
  site: string;
  priority: string;
  approvalRequired: boolean;
  acknowledgementForced: boolean;
  levels: ApprovalRouteLevel[];
}

export type ResolverType =
  | "PERMISSION"
  | "ROLE"
  | "DESIGNATION"
  | "EMPLOYEE_LIST"
  | "ORG_HIERARCHY_TOP";
export type OnBreach = "REMIND" | "ESCALATE" | "AUTO_APPROVE";
export type OnEmpty = "FAIL" | "ESCALATE";

/** Mirrors `AnnouncementApprovalPolicy.ApprovalLevelDefinition`. */
export interface ApprovalLevelDefinition {
  level: number;
  levelCode: string;
  resolverType: ResolverType;
  /** Not required for ORG_HIERARCHY_TOP; required for every other type. */
  resolverValue?: string;
  slaHours: number;
  onBreach: OnBreach;
  onEmpty: OnEmpty;
}

/** Mirrors `AnnouncementApprovalPolicy`. */
export interface ApprovalPolicy {
  handle?: string;
  site: string;
  priority: string;
  approvalRequired: boolean;
  levels: ApprovalLevelDefinition[];
  emailOnPublish?: boolean;
  acknowledgementRequired?: boolean;
  /** EMERGENCY only — the post-hoc ratification window. */
  ratificationHours?: number;
  systemDefined?: boolean;
  modifiedBy?: string;
}

/**
 * Shared action body. `expectedLevel` is the level the UI rendered — sending it
 * turns a stale double-click into 409 ALREADY_ACTIONED instead of approving a
 * step the user never saw (handover §4.1).
 */
export interface AnnouncementActionPayload {
  organizationId: string;
  announcementHandle: string;
  actorId: string;
  remarks?: string;
  expectedLevel?: number;
  emergencyJustification?: string;
  ratified?: boolean;
}
