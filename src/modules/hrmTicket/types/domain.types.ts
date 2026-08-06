/** Core ticketing entities, mirroring the backend `ticket` module. */

export type TicketStatus =
  | 'NEW'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'PENDING_REQUESTER'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  | 'CANCELLED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TicketAttachment {
  attachmentId: string;
  fileName: string;
  fileType?: string;
  fileSizeBytes?: number;
  /** Only ever populated by `downloadAttachment` — list and detail reads omit it. */
  contentBase64?: string;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedAt?: string;
}

export interface TicketComment {
  commentId: string;
  ticketNumber: string;
  body: string;
  /** Agents-only. The backend strips these before they reach a requester. */
  internal: boolean;
  systemGenerated: boolean;
  eventType?: string;
  authorCode?: string;
  authorName?: string;
  authorIsAgent: boolean;
  attachments?: TicketAttachment[];
  createdAt?: string;
  editedAt?: string;
  ownComment: boolean;
}

/**
 * A ticket in full.
 *
 * The `can*` flags come from the server rather than being derived here. Status and assignee alone
 * do not say whether the viewer agents for the ticket's group, and two implementations of the same
 * rule drift — the buttons follow what the server says it will accept.
 */
export interface Ticket {
  ticketNumber: string;
  organizationId?: string;

  subject: string;
  description?: string;

  categoryCode?: string;
  categoryName?: string;
  parentCategoryCode?: string;

  priority: TicketPriority;
  status: TicketStatus;

  tags?: string[];
  attachments?: TicketAttachment[];

  raisedByCode?: string;
  raisedByName?: string;
  raisedByEmail?: string;
  onBehalfOfCode?: string;
  onBehalfOfName?: string;
  watcherCodes?: string[];
  watcherNames?: string[];

  supportGroupCode?: string;
  supportGroupName?: string;
  assignedToCode?: string;
  assignedToName?: string;
  assignedAt?: string;

  responseDueAt?: string;
  resolutionDueAt?: string;
  firstRespondedAt?: string;
  responseSlaBreached?: boolean;
  resolutionSlaBreached?: boolean;
  /** Negative once overdue. Null when there is no target, or the ticket is finished. */
  minutesToResolutionDue?: number | null;
  slaClockPaused?: boolean;

  resolutionNotes?: string;
  resolvedByCode?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  closedAt?: string;
  autoClosed?: boolean;
  cancellationReason?: string;
  reopenCount?: number;
  satisfactionRating?: number | null;
  satisfactionComment?: string;

  comments?: TicketComment[];
  commentCount?: number;

  createdAt?: string;
  lastActivityAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;

  viewerIsAgent?: boolean;
  viewerIsRequester?: boolean;
  canComment?: boolean;
  canEdit?: boolean;
  canAssign?: boolean;
  canResolve?: boolean;
  canReopen?: boolean;
  canClose?: boolean;
  canCancel?: boolean;
  canRate?: boolean;
}

/** One row in a queue. Deliberately without description, attachments or the thread. */
export interface TicketSummary {
  ticketNumber: string;
  subject: string;
  categoryCode?: string;
  categoryName?: string;
  priority: TicketPriority;
  status: TicketStatus;
  raisedByCode?: string;
  raisedByName?: string;
  supportGroupCode?: string;
  assignedToCode?: string;
  assignedToName?: string;
  resolutionDueAt?: string;
  minutesToResolutionDue?: number | null;
  responseSlaBreached?: boolean;
  resolutionSlaBreached?: boolean;
  slaClockPaused?: boolean;
  tags?: string[];
  commentCount?: number;
  attachmentCount?: number;
  reopenCount?: number;
  createdAt?: string;
  lastActivityAt?: string;
}

export interface TicketCategory {
  categoryCode: string;
  organizationId?: string;
  name: string;
  description?: string;
  parentCode?: string;
  parentName?: string;
  supportGroupCode?: string;
  supportGroupName?: string;
  defaultPriority?: TicketPriority;
  responseSlaHours?: number | null;
  resolutionSlaHours?: number | null;
  autoCloseAfterDays?: number | null;
  requesterGuidance?: string;
  displayOrder?: number | null;
  /** Hidden from the raise picker without being deleted. */
  restricted?: boolean;
  children?: TicketCategory[];
  openTicketCount?: number;
}

export interface TicketSupportGroup {
  groupCode: string;
  organizationId?: string;
  name: string;
  description?: string;
  memberCodes?: string[];
  /** `"R10138 - Name"` per member, in the same order as `memberCodes`. */
  memberNames?: string[];
  leadCode?: string;
  leadName?: string;
  defaultAssigneeCode?: string;
  categoryCodes?: string[];
  openTicketCount?: number;
  unassignedCount?: number;
}

export interface TicketAgentLoad {
  employeeCode: string;
  employeeName?: string;
  openCount: number;
  breachedCount: number;
  resolvedInWindow: number;
}

export interface TicketDailyCount {
  date: string;
  raised: number;
  resolved: number;
}

export interface TicketDashboard {
  totalRaised: number;
  totalResolved: number;
  totalClosed: number;
  currentlyOpen: number;
  currentlyUnassigned: number;
  responseBreaches: number;
  resolutionBreaches: number;
  slaCompliancePercent?: number | null;
  avgFirstResponseHours?: number | null;
  avgResolutionHours?: number | null;
  reopenRatePercent?: number | null;
  avgSatisfactionRating?: number | null;
  byStatus?: Record<string, number>;
  byPriority?: Record<string, number>;
  byCategory?: Record<string, number>;
  byGroup?: Record<string, number>;
  agentLoad?: TicketAgentLoad[];
  dailyVolume?: TicketDailyCount[];
  oldestOpen?: TicketSummary[];
}
