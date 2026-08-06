/** Screen-local shapes: tab keys, form values, filter state. */

import type { TicketPriority, TicketStatus } from './domain.types';
import type { TicketScope } from './api.types';

/**
 * Workspace tabs.
 *
 * `queue` and `dashboard` are only mounted for agents and report holders — the tab list is built
 * from grants, so a user whose access is revoked mid-session cannot be left on a tab that no
 * longer renders.
 */
export type TicketTabKey = 'my' | 'queue' | 'assigned' | 'all' | 'categories' | 'groups' | 'dashboard';

export interface TicketFilterState {
  scope: TicketScope;
  statuses: TicketStatus[];
  priorities: TicketPriority[];
  categoryCodes: string[];
  supportGroupCode?: string;
  searchText: string;
  openOnly: boolean;
  unassignedOnly: boolean;
  slaBreachedOnly: boolean;
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
}

/** What the raise / edit form collects. Files are held separately, outside the form model. */
export interface TicketFormValues {
  categoryCode: string;
  subject: string;
  description: string;
  priority?: TicketPriority;
  tags?: string[];
  watcherCodes?: string[];
  onBehalfOfCode?: string;
  /** Assign at raise time — only rendered for agents on the serving queue. */
  assignedToCode?: string;
}

export interface TicketCategoryFormValues {
  categoryCode: string;
  name: string;
  description?: string;
  parentCode?: string;
  supportGroupCode: string;
  defaultPriority?: TicketPriority;
  responseSlaHours?: number | null;
  resolutionSlaHours?: number | null;
  autoCloseAfterDays?: number | null;
  requesterGuidance?: string;
  displayOrder?: number | null;
  restricted?: boolean;
}

export interface TicketGroupFormValues {
  groupCode: string;
  name: string;
  description?: string;
  memberCodes?: string[];
  leadCode?: string;
  defaultAssigneeCode?: string;
}

/** Which transition dialog is open. One at a time — they all act on the same ticket. */
export type TicketActionKind =
  | 'assign'
  | 'hold'
  | 'resolve'
  | 'reopen'
  | 'close'
  | 'cancel'
  | 'rate'
  | null;
