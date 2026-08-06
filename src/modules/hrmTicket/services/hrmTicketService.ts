import api from '@/services/api';
import type {
  AddCommentPayload,
  CreateTicketPayload,
  GetTicketPayload,
  TicketActionPayload,
  TicketAttachmentResult,
  TicketCategoryPayload,
  TicketConfigLookupPayload,
  TicketDashboardPayload,
  TicketDetailResult,
  TicketListResult,
  TicketSearchPayload,
  TicketSupportGroupPayload,
  UpdateTicketPayload,
} from '../types/api.types';
import type {
  TicketCategory,
  TicketComment,
  TicketDashboard,
  TicketSupportGroup,
} from '../types/domain.types';
import { TICKET_BASE, TICKET_CONFIG_BASE } from '../utils/ticketConstants';

/**
 * Ticket service — all POST, on the shared `api` instance, which unwraps the
 * `{ message_details, response }` envelope and rejects on `msg_type: 'E'`.
 *
 * Each transition has its own method rather than one `setStatus`, mirroring the backend: resolving
 * carries notes, reopening bumps a counter and clears the resolution, closing opens the rating
 * window. Collapsing them here would only move the guesswork into the component.
 */
export class HrmTicketService {
  // ── Lifecycle ─────────────────────────────────────────────────────────

  static async createTicket(payload: CreateTicketPayload): Promise<TicketDetailResult> {
    const res = await api.post(`${TICKET_BASE}/createTicket`, payload);
    return res.data;
  }

  static async updateTicket(payload: UpdateTicketPayload): Promise<TicketDetailResult> {
    const res = await api.post(`${TICKET_BASE}/updateTicket`, payload);
    return res.data;
  }

  /** Full record including the timeline. Internal notes are stripped server-side for requesters. */
  static async getTicket(payload: GetTicketPayload): Promise<TicketDetailResult> {
    const res = await api.post(`${TICKET_BASE}/getTicket`, payload);
    return res.data;
  }

  /** The one endpoint behind My Tickets, the group queue and the admin list. */
  static async searchTickets(payload: TicketSearchPayload): Promise<TicketListResult> {
    const res = await api.post(`${TICKET_BASE}/searchTickets`, payload);
    return (
      res.data ?? {
        page: { content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 },
      }
    );
  }

  // ── Assignment ────────────────────────────────────────────────────────

  static async assignTicket(payload: TicketActionPayload): Promise<TicketDetailResult> {
    const res = await api.post(`${TICKET_BASE}/assignTicket`, payload);
    return res.data;
  }

  /** Take an unassigned ticket from a queue the caller agents for. */
  static async claimTicket(payload: TicketActionPayload): Promise<TicketDetailResult> {
    const res = await api.post(`${TICKET_BASE}/claimTicket`, payload);
    return res.data;
  }

  // ── Transitions ───────────────────────────────────────────────────────

  static async changeStatus(payload: TicketActionPayload): Promise<TicketDetailResult> {
    const res = await api.post(`${TICKET_BASE}/changeStatus`, payload);
    return res.data;
  }

  static async resolveTicket(payload: TicketActionPayload): Promise<TicketDetailResult> {
    const res = await api.post(`${TICKET_BASE}/resolveTicket`, payload);
    return res.data;
  }

  static async reopenTicket(payload: TicketActionPayload): Promise<TicketDetailResult> {
    const res = await api.post(`${TICKET_BASE}/reopenTicket`, payload);
    return res.data;
  }

  static async closeTicket(payload: TicketActionPayload): Promise<TicketDetailResult> {
    const res = await api.post(`${TICKET_BASE}/closeTicket`, payload);
    return res.data;
  }

  static async cancelTicket(payload: TicketActionPayload): Promise<TicketDetailResult> {
    const res = await api.post(`${TICKET_BASE}/cancelTicket`, payload);
    return res.data;
  }

  static async rateTicket(payload: TicketActionPayload): Promise<TicketDetailResult> {
    const res = await api.post(`${TICKET_BASE}/rateTicket`, payload);
    return res.data;
  }

  // ── Thread ────────────────────────────────────────────────────────────

  static async addComment(payload: AddCommentPayload): Promise<TicketComment> {
    const res = await api.post(`${TICKET_BASE}/addComment`, payload);
    return res.data;
  }

  /** One file at a time — ticket reads never carry attachment bytes. */
  static async downloadAttachment(payload: GetTicketPayload): Promise<TicketAttachmentResult> {
    const res = await api.post(`${TICKET_BASE}/downloadAttachment`, payload);
    return res.data;
  }

  // ── Reporting ─────────────────────────────────────────────────────────

  static async dashboard(payload: TicketDashboardPayload): Promise<TicketDashboard> {
    const res = await api.post(`${TICKET_BASE}/dashboard`, payload);
    return res.data;
  }

  // ── Configuration ─────────────────────────────────────────────────────

  static async listCategories(payload: TicketConfigLookupPayload): Promise<TicketCategory[]> {
    const res = await api.post(`${TICKET_CONFIG_BASE}/listCategories`, payload);
    return res.data ?? [];
  }

  static async createCategory(payload: TicketCategoryPayload): Promise<TicketCategory> {
    const res = await api.post(`${TICKET_CONFIG_BASE}/createCategory`, payload);
    return res.data;
  }

  static async updateCategory(payload: TicketCategoryPayload): Promise<TicketCategory> {
    const res = await api.post(`${TICKET_CONFIG_BASE}/updateCategory`, payload);
    return res.data;
  }

  /** Soft delete. Refused by the backend while the category has live tickets or children. */
  static async deleteCategory(payload: TicketConfigLookupPayload): Promise<void> {
    await api.post(`${TICKET_CONFIG_BASE}/deleteCategory`, payload);
  }

  static async listSupportGroups(
    payload: TicketConfigLookupPayload,
  ): Promise<TicketSupportGroup[]> {
    const res = await api.post(`${TICKET_CONFIG_BASE}/listSupportGroups`, payload);
    return res.data ?? [];
  }

  static async createSupportGroup(
    payload: TicketSupportGroupPayload,
  ): Promise<TicketSupportGroup> {
    const res = await api.post(`${TICKET_CONFIG_BASE}/createSupportGroup`, payload);
    return res.data;
  }

  static async updateSupportGroup(
    payload: TicketSupportGroupPayload,
  ): Promise<TicketSupportGroup> {
    const res = await api.post(`${TICKET_CONFIG_BASE}/updateSupportGroup`, payload);
    return res.data;
  }

  static async deleteSupportGroup(payload: TicketConfigLookupPayload): Promise<void> {
    await api.post(`${TICKET_CONFIG_BASE}/deleteSupportGroup`, payload);
  }

  /** Assignee picker — accepts either a category code or a group code. */
  static async assignableAgents(payload: TicketConfigLookupPayload): Promise<string[]> {
    const res = await api.post(`${TICKET_CONFIG_BASE}/assignableAgents`, payload);
    return res.data ?? [];
  }
}
