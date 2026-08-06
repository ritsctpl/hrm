import type { TicketPriority, TicketStatus } from '../types/domain.types';

/** Backend base paths — leading slash, no `app/v1/` (the Axios baseURL already has it). */
export const TICKET_BASE = '/hrm-service/ticket';
export const TICKET_CONFIG_BASE = '/hrm-service/ticket/config';

export const MODULE_CODE = 'HRM_TICKET';

/** Inline base64 upload, matching the Asset / User Guide contract rather than multipart. */
export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_POST = 5;

export const DEFAULT_PAGE_SIZE = 20;

export const STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: 'New',
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  PENDING_REQUESTER: 'Awaiting You',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',
  CANCELLED: 'Cancelled',
};

/**
 * Ant Design tag colours per status. Deliberately not a rainbow: the states that need attention
 * (NEW, REOPENED, PENDING_REQUESTER) carry warm colours, work-in-flight is blue, and finished
 * states are grey — so a queue scanned at a glance shows what needs picking up.
 */
export const STATUS_COLORS: Record<TicketStatus, string> = {
  NEW: 'volcano',
  OPEN: 'blue',
  IN_PROGRESS: 'processing',
  ON_HOLD: 'default',
  PENDING_REQUESTER: 'gold',
  RESOLVED: 'green',
  CLOSED: 'default',
  REOPENED: 'red',
  CANCELLED: 'default',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW: 'default',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
};

export const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = (
  Object.keys(STATUS_LABELS) as TicketStatus[]
).map((value) => ({ value, label: STATUS_LABELS[value] }));

export const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = (
  Object.keys(PRIORITY_LABELS) as TicketPriority[]
).map((value) => ({ value, label: PRIORITY_LABELS[value] }));

/**
 * Statuses an agent may set through `changeStatus`. Resolve, close, cancel and reopen are
 * excluded on purpose — each has its own endpoint because each carries side effects (resolution
 * notes, the reopen counter, the rating window) that a generic status setter would skip.
 */
export const AGENT_STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'PENDING_REQUESTER', label: 'Awaiting Requester' },
];

/** Statuses that are finished — no further action, and no SLA countdown. */
export const TERMINAL_STATUSES: TicketStatus[] = ['CLOSED', 'CANCELLED'];

/** The default "open work" filter, used by every queue tab. */
export const OPEN_STATUSES: TicketStatus[] = [
  'NEW',
  'OPEN',
  'IN_PROGRESS',
  'ON_HOLD',
  'PENDING_REQUESTER',
  'REOPENED',
];

/** SLA hour presets offered in the category form — free entry is still allowed. */
export const SLA_HOUR_PRESETS = [1, 2, 4, 8, 24, 48, 72, 168];
