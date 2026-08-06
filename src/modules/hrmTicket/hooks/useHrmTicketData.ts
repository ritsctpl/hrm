'use client';

import { useCallback } from 'react';
import { message } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmTicketService } from '../services/hrmTicketService';
import { useHrmTicketStore } from '../stores/hrmTicketStore';
import type {
  AddCommentPayload,
  AttachmentPayload,
  CreateTicketPayload,
  TicketActionPayload,
  TicketCategoryPayload,
  TicketSearchPayload,
  TicketSupportGroupPayload,
  UpdateTicketPayload,
} from '../types/api.types';
import type { Ticket } from '../types/domain.types';
import type { TicketTabKey } from '../types/ui.types';
import { base64ToBlob, downloadBlob } from '../utils/ticketHelpers';

/**
 * The signed-in user, for the actor field every ticket call carries.
 *
 * The backend prefers the gateway-set `X-User-ID` header, but this deployment's gateway does not
 * inject it — so without a body-level actor every read resolves to an unidentified caller, who by
 * design can see nothing. The backend accepts a userId, a work email, an employee code or a UUID
 * handle here and resolves whichever arrives.
 */
export function useCurrentActor(): string {
  const { userId, rl_user_id, userEmail } = parseCookies();
  return userId || rl_user_id || userEmail || 'system';
}

/**
 * Wraps the store with the service calls and user feedback, so components stay presentational.
 *
 * Every write returns the updated ticket rather than a boolean where it can, because the backend
 * recomputes the `can*` flags on each transition — refetching separately would leave the buttons
 * one round trip behind the state they describe.
 */
export function useHrmTicketData() {
  const organizationId = getOrganizationId();
  const actor = useCurrentActor();

  /** Shared error path: the interceptor already surfaced the backend's own message. */
  const fail = useCallback((error: unknown, fallback: string) => {
    const text = error instanceof Error && error.message ? error.message : fallback;
    message.error(text);
  }, []);

  // ── Lists ───────────────────────────────────────────────────────────

  const loadTickets = useCallback(
    async (tab: TicketTabKey) => {
      const { filters, setRows, setRowsLoading, setCounts } = useHrmTicketStore.getState();
      const filter = filters[tab];
      setRowsLoading(true);
      try {
        const payload: TicketSearchPayload = {
          organizationId,
          userId: actor,
          scope: filter.scope,
          statuses: filter.statuses.length ? filter.statuses : undefined,
          priorities: filter.priorities.length ? filter.priorities : undefined,
          categoryCodes: filter.categoryCodes.length ? filter.categoryCodes : undefined,
          supportGroupCode: filter.supportGroupCode,
          searchText: filter.searchText || undefined,
          // An explicit status filter already says what to include; sending openOnly alongside it
          // would intersect the two and silently drop CLOSED when the user asked for it.
          openOnly: filter.statuses.length ? false : filter.openOnly,
          unassignedOnly: filter.unassignedOnly,
          slaBreachedOnly: filter.slaBreachedOnly ? true : undefined,
          page: filter.page,
          size: filter.size,
          sortBy: filter.sortBy,
          sortDirection: filter.sortDirection,
        };
        const result = await HrmTicketService.searchTickets(payload);
        setRows(result.page?.content ?? [], result.page?.totalElements ?? 0);
        setCounts(result.statusCounts ?? {}, result.breachedCount ?? 0);
      } catch (error) {
        fail(error, 'Failed to load tickets');
        setRows([], 0);
        setCounts({}, 0);
      } finally {
        setRowsLoading(false);
      }
    },
    [organizationId, actor, fail],
  );

  const openTicket = useCallback(
    async (ticketNumber: string) => {
      const { setSelectedTicket, setSelectedLoading } = useHrmTicketStore.getState();
      setSelectedLoading(true);
      try {
        const ticket = await HrmTicketService.getTicket({ organizationId, userId: actor, ticketNumber });
        setSelectedTicket(ticket);
        return ticket;
      } catch (error) {
        fail(error, 'Failed to open ticket');
        setSelectedTicket(null);
        return null;
      } finally {
        setSelectedLoading(false);
      }
    },
    [organizationId, actor, fail],
  );

  // ── Writes ──────────────────────────────────────────────────────────

  const createTicket = useCallback(
    async (
      payload: Omit<CreateTicketPayload, 'organizationId' | 'attachments'>,
      attachments: AttachmentPayload[] = [],
    ): Promise<Ticket | null> => {
      const { setSaving } = useHrmTicketStore.getState();
      setSaving(true);
      try {
        const ticket = await HrmTicketService.createTicket({
          ...payload,
          organizationId,
          raisedBy: actor,
          attachments: attachments.length ? attachments : undefined,
        });
        message.success(`Ticket ${ticket.ticketNumber} raised`);
        return ticket;
      } catch (error) {
        fail(error, 'Failed to raise the ticket');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [organizationId, actor, fail],
  );

  const updateTicket = useCallback(
    async (
      payload: Omit<UpdateTicketPayload, 'organizationId' | 'newAttachments'>,
      attachments: AttachmentPayload[] = [],
    ): Promise<Ticket | null> => {
      const { setSaving, setSelectedTicket } = useHrmTicketStore.getState();
      setSaving(true);
      try {
        const ticket = await HrmTicketService.updateTicket({
          ...payload,
          organizationId,
          updatedBy: actor,
          newAttachments: attachments.length ? attachments : undefined,
        });
        setSelectedTicket(ticket);
        message.success('Ticket updated');
        return ticket;
      } catch (error) {
        fail(error, 'Failed to update the ticket');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [organizationId, actor, fail],
  );

  /**
   * Every transition goes through here. The service method is passed in rather than a status
   * string so each endpoint keeps its own contract, and the refreshed ticket lands back in the
   * store in one place.
   */
  const runAction = useCallback(
    async (
      action: (payload: TicketActionPayload) => Promise<Ticket>,
      payload: Omit<TicketActionPayload, 'organizationId'>,
      successMessage: string,
    ): Promise<Ticket | null> => {
      const { setActing, setSelectedTicket, setActiveAction } = useHrmTicketStore.getState();
      setActing(true);
      try {
        const ticket = await action({ ...payload, organizationId, performedBy: actor });
        setSelectedTicket(ticket);
        setActiveAction(null);
        message.success(successMessage);
        return ticket;
      } catch (error) {
        fail(error, 'The action could not be completed');
        return null;
      } finally {
        setActing(false);
      }
    },
    [organizationId, actor, fail],
  );

  const assignTicket = useCallback(
    (ticketNumber: string, assigneeCode: string, note?: string) =>
      runAction(HrmTicketService.assignTicket, { ticketNumber, assigneeCode, note }, 'Ticket assigned'),
    [runAction],
  );

  const claimTicket = useCallback(
    (ticketNumber: string) =>
      runAction(HrmTicketService.claimTicket, { ticketNumber }, 'Ticket claimed'),
    [runAction],
  );

  const changeStatus = useCallback(
    (ticketNumber: string, status: TicketActionPayload['status'], note?: string) =>
      runAction(HrmTicketService.changeStatus, { ticketNumber, status, note }, 'Status updated'),
    [runAction],
  );

  const resolveTicket = useCallback(
    (ticketNumber: string, note: string) =>
      runAction(HrmTicketService.resolveTicket, { ticketNumber, note }, 'Ticket resolved'),
    [runAction],
  );

  const reopenTicket = useCallback(
    (ticketNumber: string, note: string) =>
      runAction(HrmTicketService.reopenTicket, { ticketNumber, note }, 'Ticket reopened'),
    [runAction],
  );

  const closeTicket = useCallback(
    (ticketNumber: string, note?: string, satisfactionRating?: number) =>
      runAction(
        HrmTicketService.closeTicket,
        { ticketNumber, note, satisfactionRating },
        'Ticket closed',
      ),
    [runAction],
  );

  const cancelTicket = useCallback(
    (ticketNumber: string, note: string) =>
      runAction(HrmTicketService.cancelTicket, { ticketNumber, note }, 'Ticket cancelled'),
    [runAction],
  );

  const rateTicket = useCallback(
    (ticketNumber: string, satisfactionRating: number, note?: string) =>
      runAction(
        HrmTicketService.rateTicket,
        { ticketNumber, satisfactionRating, note },
        'Thank you for your feedback',
      ),
    [runAction],
  );

  const addComment = useCallback(
    async (
      payload: Omit<AddCommentPayload, 'organizationId' | 'attachments'>,
      attachments: AttachmentPayload[] = [],
    ): Promise<boolean> => {
      const { setActing } = useHrmTicketStore.getState();
      setActing(true);
      try {
        await HrmTicketService.addComment({
          ...payload,
          organizationId,
          authorCode: actor,
          attachments: attachments.length ? attachments : undefined,
        });
        // Refetched rather than appended: the comment may have moved the ticket's status, and the
        // `can*` flags that drive the action bar are recomputed with it.
        await openTicket(payload.ticketNumber);
        return true;
      } catch (error) {
        fail(error, 'Failed to post the comment');
        return false;
      } finally {
        setActing(false);
      }
    },
    [organizationId, actor, openTicket, fail],
  );

  /**
   * The attachment's bytes, for the preview. Separate from {@link downloadAttachment}, which pushes
   * the same payload straight to a file — the preview needs it in hand, not on disk.
   */
  const fetchAttachment = useCallback(
    async (ticketNumber: string, attachmentId: string) => {
      try {
        return await HrmTicketService.downloadAttachment({
          organizationId,
          userId: actor,
          ticketNumber,
          attachmentId,
        });
      } catch (error) {
        fail(error, 'Failed to load the attachment');
        return null;
      }
    },
    [organizationId, actor, fail],
  );

  const downloadAttachment = useCallback(
    async (ticketNumber: string, attachmentId: string, fileName: string) => {
      try {
        const attachment = await HrmTicketService.downloadAttachment({
          organizationId,
          userId: actor,
          ticketNumber,
          attachmentId,
        });
        if (!attachment?.contentBase64) {
          message.warning('That attachment is no longer stored');
          return;
        }
        downloadBlob(
          base64ToBlob(attachment.contentBase64, attachment.fileType || 'application/octet-stream'),
          attachment.fileName || fileName,
        );
      } catch (error) {
        fail(error, 'Failed to download the attachment');
      }
    },
    [organizationId, actor, fail],
  );

  // ── Configuration ───────────────────────────────────────────────────

  const loadCategories = useCallback(
    async (options: { asTree?: boolean; includeRestricted?: boolean; withCounts?: boolean } = {}) => {
      const { setCategories, setCategoriesLoading } = useHrmTicketStore.getState();
      setCategoriesLoading(true);
      try {
        const categories = await HrmTicketService.listCategories({
          organizationId,
          performedBy: actor,
          ...options,
        });
        setCategories(categories);
      } catch (error) {
        fail(error, 'Failed to load ticket categories');
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    },
    [organizationId, actor, fail],
  );

  const loadSupportGroups = useCallback(
    async (withCounts = false) => {
      const { setSupportGroups, setSupportGroupsLoading } = useHrmTicketStore.getState();
      setSupportGroupsLoading(true);
      try {
        const groups = await HrmTicketService.listSupportGroups({
          organizationId,
          performedBy: actor,
          withCounts,
        });
        setSupportGroups(groups);
      } catch (error) {
        fail(error, 'Failed to load support groups');
        setSupportGroups([]);
      } finally {
        setSupportGroupsLoading(false);
      }
    },
    [organizationId, actor, fail],
  );

  const loadAssignableAgents = useCallback(
    async (code: string) => {
      const { setAssignableAgents } = useHrmTicketStore.getState();
      try {
        setAssignableAgents(
          await HrmTicketService.assignableAgents({ organizationId, performedBy: actor, code }),
        );
      } catch {
        // An empty picker is recoverable — the lead can still type a code — while a toast here
        // would fire every time a detail panel opens on a category with no group.
        setAssignableAgents([]);
      }
    },
    [organizationId, actor],
  );

  const saveCategory = useCallback(
    async (payload: Omit<TicketCategoryPayload, 'organizationId'>, isEdit: boolean) => {
      const { setSaving } = useHrmTicketStore.getState();
      setSaving(true);
      try {
        const body = { ...payload, organizationId, performedBy: actor };
        if (isEdit) await HrmTicketService.updateCategory(body);
        else await HrmTicketService.createCategory(body);
        message.success(`Category ${isEdit ? 'updated' : 'created'}`);
        return true;
      } catch (error) {
        fail(error, 'Failed to save the category');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [organizationId, actor, fail],
  );

  const deleteCategory = useCallback(
    async (code: string) => {
      try {
        await HrmTicketService.deleteCategory({ organizationId, performedBy: actor, code });
        message.success('Category removed');
        return true;
      } catch (error) {
        // The backend refuses while live tickets or children remain, and its message names them —
        // which is exactly what the administrator needs, so it is shown verbatim.
        fail(error, 'Failed to remove the category');
        return false;
      }
    },
    [organizationId, actor, fail],
  );

  const saveSupportGroup = useCallback(
    async (payload: Omit<TicketSupportGroupPayload, 'organizationId'>, isEdit: boolean) => {
      const { setSaving } = useHrmTicketStore.getState();
      setSaving(true);
      try {
        const body = { ...payload, organizationId, performedBy: actor };
        if (isEdit) await HrmTicketService.updateSupportGroup(body);
        else await HrmTicketService.createSupportGroup(body);
        message.success(`Support group ${isEdit ? 'updated' : 'created'}`);
        return true;
      } catch (error) {
        fail(error, 'Failed to save the support group');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [organizationId, actor, fail],
  );

  const deleteSupportGroup = useCallback(
    async (code: string) => {
      try {
        await HrmTicketService.deleteSupportGroup({ organizationId, performedBy: actor, code });
        message.success('Support group removed');
        return true;
      } catch (error) {
        fail(error, 'Failed to remove the support group');
        return false;
      }
    },
    [organizationId, actor, fail],
  );

  const loadDashboard = useCallback(
    async (supportGroupCode?: string, fromDate?: string, toDate?: string) => {
      const { setDashboard, setDashboardLoading } = useHrmTicketStore.getState();
      setDashboardLoading(true);
      try {
        setDashboard(
          await HrmTicketService.dashboard({
            organizationId,
            userId: actor,
            supportGroupCode,
            fromDate,
            toDate,
          }),
        );
      } catch (error) {
        fail(error, 'Failed to load the helpdesk dashboard');
        setDashboard(null);
      } finally {
        setDashboardLoading(false);
      }
    },
    [organizationId, actor, fail],
  );

  return {
    loadTickets,
    openTicket,
    createTicket,
    updateTicket,
    assignTicket,
    claimTicket,
    changeStatus,
    resolveTicket,
    reopenTicket,
    closeTicket,
    cancelTicket,
    rateTicket,
    addComment,
    downloadAttachment,
    fetchAttachment,
    loadCategories,
    loadSupportGroups,
    loadAssignableAgents,
    saveCategory,
    deleteCategory,
    saveSupportGroup,
    deleteSupportGroup,
    loadDashboard,
  };
}
