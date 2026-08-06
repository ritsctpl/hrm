/** Request and response shapes for the ticket endpoints. All calls are POST. */

import type {
  Ticket,
  TicketAttachment,
  TicketPriority,
  TicketStatus,
  TicketSummary,
} from './domain.types';

/**
 * Every payload carries the tenant, and the caller's identity.
 *
 * The backend prefers the gateway-set `X-User-ID` header — it comes from the validated JWT and is
 * the one identity a caller cannot choose. Not every deployment injects it, so each request also
 * carries the actor in the body as a fallback. Without it an unidentified caller matches nothing
 * and every list comes back empty, which reads as a broken screen rather than a missing header.
 */
interface TenantScoped {
  organizationId?: string;
  site?: string;
}

/** Reads: the body-level actor fallback. Field name matches the User Guide module's convention. */
interface ActorScoped {
  userId?: string;
}

/** Which slice of the queue a search covers. Narrowed server-side to what the caller may see. */
export type TicketScope = 'MY' | 'ASSIGNED' | 'GROUP' | 'WATCHING' | 'ALL';

export interface AttachmentPayload {
  fileName: string;
  fileType?: string;
  fileSizeBytes?: number;
  /** Raw base64, no `data:` URI prefix. */
  contentBase64: string;
}

export interface CreateTicketPayload extends TenantScoped {
  /** Actor fallback when the gateway sets no `X-User-ID`. */
  raisedBy?: string;
  categoryCode: string;
  subject: string;
  description: string;
  priority?: TicketPriority;
  tags?: string[];
  attachments?: AttachmentPayload[];
  watcherCodes?: string[];
  /** Requires the assign grant — filing for someone else. */
  onBehalfOfCode?: string;
  /** Assign at raise time. Agents only, and must be a member of the serving group. */
  assignedToCode?: string;
}

export interface UpdateTicketPayload extends TenantScoped {
  /** Actor fallback when the gateway sets no `X-User-ID`. */
  updatedBy?: string;
  ticketNumber: string;
  subject?: string;
  description?: string;
  categoryCode?: string;
  priority?: TicketPriority;
  tags?: string[];
  watcherCodes?: string[];
  /** Appended; attachments are never removed by an update. */
  newAttachments?: AttachmentPayload[];
}

export interface GetTicketPayload extends TenantScoped, ActorScoped {
  ticketNumber: string;
  /** `downloadAttachment` only. */
  attachmentId?: string;
  excludeComments?: boolean;
}

export interface TicketSearchPayload extends TenantScoped, ActorScoped {
  scope?: TicketScope;
  statuses?: TicketStatus[];
  priorities?: TicketPriority[];
  categoryCodes?: string[];
  supportGroupCode?: string;
  assignedToCode?: string;
  raisedByCode?: string;
  tags?: string[];
  searchText?: string;
  createdFrom?: string;
  createdTo?: string;
  slaBreachedOnly?: boolean;
  openOnly?: boolean;
  unassignedOnly?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

/**
 * The shape shared by every act on an existing ticket. The backend reads only the fields its
 * endpoint needs, so one type covers assign, claim, status, resolve, reopen, close, cancel, rate.
 */
export interface TicketActionPayload extends TenantScoped {
  /** Actor fallback when the gateway sets no `X-User-ID`. */
  performedBy?: string;
  ticketNumber: string;
  assigneeCode?: string;
  status?: TicketStatus;
  note?: string;
  internalNote?: boolean;
  satisfactionRating?: number;
}

export interface AddCommentPayload extends TenantScoped {
  /** Actor fallback when the gateway sets no `X-User-ID`. */
  authorCode?: string;
  ticketNumber: string;
  body: string;
  internal?: boolean;
  attachments?: AttachmentPayload[];
  /** Move the ticket in the same call — an agent asking a question usually means PENDING_REQUESTER. */
  statusAfterComment?: TicketStatus;
}

export interface TicketPage {
  content: TicketSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Counts travel with the page so the tab badges and the table can never disagree. */
export interface TicketListResult {
  page: TicketPage;
  statusCounts?: Record<string, number>;
  breachedCount?: number;
  /** May be narrower than the scope requested. */
  appliedScope?: TicketScope;
}

export interface TicketConfigLookupPayload extends TenantScoped {
  /** Actor fallback when the gateway sets no `X-User-ID`. */
  performedBy?: string;
  /** A categoryCode or groupCode; ignored by the list endpoints. */
  code?: string;
  includeRestricted?: boolean;
  asTree?: boolean;
  withCounts?: boolean;
}

export interface TicketCategoryPayload extends TenantScoped {
  /** Actor fallback when the gateway sets no `X-User-ID`. */
  performedBy?: string;
  categoryCode: string;
  name?: string;
  description?: string;
  parentCode?: string;
  supportGroupCode?: string;
  defaultPriority?: TicketPriority;
  responseSlaHours?: number | null;
  resolutionSlaHours?: number | null;
  autoCloseAfterDays?: number | null;
  requesterGuidance?: string;
  displayOrder?: number | null;
  restricted?: boolean;
}

export interface TicketSupportGroupPayload extends TenantScoped {
  /** Actor fallback when the gateway sets no `X-User-ID`. */
  performedBy?: string;
  groupCode: string;
  name?: string;
  description?: string;
  memberCodes?: string[];
  leadCode?: string;
  defaultAssigneeCode?: string;
}

export interface TicketDashboardPayload extends TenantScoped, ActorScoped {
  fromDate?: string;
  toDate?: string;
  supportGroupCode?: string;
}

export type TicketDetailResult = Ticket;
export type TicketAttachmentResult = TicketAttachment;
