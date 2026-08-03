import api from "@/services/api";
import {
  GetAnnouncementsPayload,
  GetAnnouncementDetailPayload,
  ListAnnouncementsPayload,
  MarkReadPayload,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
  PublishAnnouncementPayload,
  WithdrawAnnouncementPayload,
  DeleteAnnouncementPayload,
  GetEngagementPayload,
  GetPinnedAnnouncementsPayload,
  PreviewAudiencePayload,
  AudienceResolution,
  AnnouncementCategoryRecord,
  AnnouncementActionPayload,
} from "../types/api.types";
import { Announcement, EngagementStats } from "../types/domain.types";

/**
 * Announcements moved off the shared Policy controller onto a dedicated one
 * (frontend-handover.md §0, 2026-07-31). Endpoint names changed with it —
 * `/getAnnouncement` → `/get`, `/listAnnouncements` → `/search`, and so on.
 */
const BASE = "/hrm-service/announcement";

/**
 * Unwraps a list response. The announcement controller mixes shapes: some
 * endpoints return a bare List, `/getMyAnnouncements` returns a PageResponse
 * (`{content}`), and `/search` returns an ArchiveSearchResponse
 * (`{results: {content}}`). Always returns an array so callers can spread and
 * map without a runtime guard at every site.
 */
function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  const d = data as { content?: T[]; results?: { content?: T[] } } | null | undefined;
  if (Array.isArray(d?.content)) return d.content;
  if (Array.isArray(d?.results?.content)) return d.results.content;
  return [];
}

/**
 * The feed endpoints answer from the per-employee delivery record, which keys
 * the announcement as `announcementHandle` and has no `handle` of its own.
 * Every other endpoint — mark-read, acknowledge, `/get` — takes `handle`, so
 * normalize once here rather than making each caller remember which shape it
 * is holding.
 *
 * The delivery snapshot also carries no message body: it stores the title and
 * summary only, so a feed that shows the message has to fetch it per item.
 */
function withHandle(items: Announcement[]): Announcement[] {
  return items.map((a) => ({
    ...a,
    handle: a.handle ?? (a as { announcementHandle?: string }).announcementHandle ?? "",
  }));
}

export class HrmAnnouncementService {
  static async getFeed(payload: GetAnnouncementsPayload): Promise<Announcement[]> {
    const res = await api.post(`${BASE}/getMyAnnouncements`, payload);
    return withHandle(asList<Announcement>(res.data));
  }

  /** Audience-scoped — without an employee code the server has nothing to match. */
  static async getPinned(payload: GetPinnedAnnouncementsPayload): Promise<Announcement[]> {
    const res = await api.post(`${BASE}/getPinned`, payload);
    return withHandle(asList<Announcement>(res.data));
  }

  static async getDetail(payload: GetAnnouncementDetailPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/get`, payload);
    return res.data;
  }

  static async markRead(payload: MarkReadPayload): Promise<void> {
    await api.post(`${BASE}/markAsRead`, payload);
  }

  /**
   * Records an explicit acknowledgement. Distinct from markAsRead: reading is
   * passive, acknowledging is the employee confirming they have understood —
   * it's what `acknowledgedCount` and the overdue tracking count.
   */
  static async acknowledge(payload: MarkReadPayload): Promise<void> {
    await api.post(`${BASE}/acknowledge`, payload);
  }

  static async listAnnouncements(payload: ListAnnouncementsPayload): Promise<Announcement[]> {
    const res = await api.post(`${BASE}/search`, payload);
    return asList<Announcement>(res.data);
  }

  static async createAnnouncement(payload: CreateAnnouncementPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/create`, payload);
    return res.data;
  }

  static async updateAnnouncement(payload: UpdateAnnouncementPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/update`, payload);
    return res.data;
  }

  static async publishAnnouncement(payload: PublishAnnouncementPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/publish`, payload);
    return res.data;
  }

  static async withdrawAnnouncement(payload: WithdrawAnnouncementPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/withdraw`, payload);
    return res.data;
  }

  /** Per-site category records — the source of truth for the composer picker. */
  static async listCategories(organizationId: string): Promise<AnnouncementCategoryRecord[]> {
    const res = await api.post(`${BASE}/category/list`, { organizationId });
    return asList<AnnouncementCategoryRecord>(res.data);
  }

  /** `{unread, pendingAcknowledgment}` — drives the feed badge. */
  static async getMyCounts(payload: {
    organizationId: string;
    employeeCode: string;
  }): Promise<Record<string, number>> {
    const res = await api.post(`${BASE}/getMyCounts`, payload);
    return res.data ?? {};
  }

  static async getEngagementStats(payload: GetEngagementPayload): Promise<EngagementStats> {
    const res = await api.post(`${BASE}/getEngagement`, payload);
    return res.data;
  }

  static async deleteAnnouncement(payload: DeleteAnnouncementPayload): Promise<void> {
    await api.post(`${BASE}/delete`, payload);
  }

  /**
   * Resolves how many employees the current targeting actually reaches.
   * Call before save — "I didn't realise this went to all 148 people" is the
   * most common post-publish regret (screen.md §2).
   */
  static async previewAudience(payload: PreviewAudiencePayload): Promise<AudienceResolution> {
    const res = await api.post(`${BASE}/previewAudience`, payload);
    return res.data;
  }

  // ── Approval ────────────────────────────────────────────────────────────
  //
  // There is no policy controller and no route preview: approval routes to the
  // author's reporting manager, exactly as a leave request does. The per-
  // category `AnnouncementApprovalConfig` (SLA hours, delegation, self-approval)
  // is read server-side only — no endpoint exposes it, so there is nothing for
  // the UI to configure.

  /** Routes to the author's reporting manager, or HR when they have none. */
  static async submitForApproval(payload: AnnouncementActionPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/submitForApproval`, payload);
    return res.data;
  }

  /**
   * Items this approver may act on right now — the server queries
   * `currentApproverId === approverId AND status = PENDING_APPROVAL`, so the
   * list itself is the authority on what may be actioned. Never re-derive that
   * from a permission.
   */
  static async getPendingApprovals(payload: {
    organizationId: string;
    approverId: string;
  }): Promise<Announcement[]> {
    const res = await api.post(`${BASE}/getPendingApprovals`, payload);
    return asList<Announcement>(res.data);
  }

  static async approve(payload: AnnouncementActionPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/approve`, payload);
    return res.data;
  }

  static async reject(payload: AnnouncementActionPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/reject`, payload);
    return res.data;
  }

  /** Sends back to the author for edit → RETURNED. `remarks` is required. */
  static async returnForEdit(payload: AnnouncementActionPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/return`, payload);
    return res.data;
  }

  /** Author pulls their own item out of the queue → DRAFT. */
  static async withdrawSubmission(payload: AnnouncementActionPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/withdrawSubmission`, payload);
    return res.data;
  }

  /** Requires EMERGENCY_PUBLISH and `priority === "EMERGENCY"`. Bypasses approval. */
  static async publishEmergency(payload: AnnouncementActionPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/publishEmergency`, payload);
    return res.data;
  }

  /**
   * Ratify (`ratified: true`) or refuse (`false`) an emergency publish after
   * the fact. Requires ANNOUNCEMENT_MANAGE. Refusing sets status WITHDRAWN and
   * ratificationStatus REFUSED — it does not recall the emails already sent.
   */
  static async ratify(payload: AnnouncementActionPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/ratify`, payload);
    return res.data;
  }

  /**
   * Re-queues recipients whose email failed. Requires REPORT or MANAGE.
   * Audience mail is async and rate-limited, so this reports work *queued* —
   * the counts catch up as the sender drains the queue.
   */
  static async retryFailedEmails(payload: {
    organizationId: string;
    announcementHandle: string;
    actorId: string;
  }): Promise<void> {
    await api.post(`${BASE}/email/retryFailed`, payload);
  }

  /** Mails the rendered announcement to the caller only — no address param by design. */
  static async previewEmailToSelf(payload: {
    organizationId: string;
    announcementHandle: string;
    actorId: string;
  }): Promise<void> {
    await api.post(`${BASE}/email/previewSelf`, payload);
  }

  static async processScheduledPublishing(organizationId: string): Promise<void> {
    await api.post(`${BASE}/processScheduledPublishing`, { organizationId });
  }

  static async processExpiredAnnouncements(organizationId: string): Promise<void> {
    await api.post(`${BASE}/processExpired`, { organizationId });
  }
}
