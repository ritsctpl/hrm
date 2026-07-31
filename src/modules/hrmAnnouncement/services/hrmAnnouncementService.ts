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
  PreviewRoutePayload,
  ApprovalRoutePreview,
  AnnouncementActionPayload,
  ApprovalPolicy,
} from "../types/api.types";
import { Announcement, EngagementStats } from "../types/domain.types";

/**
 * Announcements moved off the shared Policy controller onto a dedicated one
 * (frontend-handover.md §0, 2026-07-31). Endpoint names changed with it —
 * `/getAnnouncement` → `/get`, `/listAnnouncements` → `/search`, and so on.
 */
const BASE = "/hrm-service/announcement";
const POLICY_BASE = `${BASE}/policy`;

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

export class HrmAnnouncementService {
  static async getFeed(payload: GetAnnouncementsPayload): Promise<Announcement[]> {
    const res = await api.post(`${BASE}/getMyAnnouncements`, payload);
    return asList<Announcement>(res.data);
  }

  static async getPinned(organizationId: string): Promise<Announcement[]> {
    const res = await api.post(`${BASE}/getPinned`, { organizationId });
    return asList<Announcement>(res.data);
  }

  static async getDetail(payload: GetAnnouncementDetailPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/get`, payload);
    return res.data;
  }

  static async markRead(payload: MarkReadPayload): Promise<void> {
    await api.post(`${BASE}/markAsRead`, payload);
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

  static async publishAnnouncement(payload: PublishAnnouncementPayload): Promise<void> {
    await api.post(`${BASE}/publish`, payload);
  }

  static async withdrawAnnouncement(payload: WithdrawAnnouncementPayload): Promise<void> {
    await api.post(`${BASE}/withdraw`, payload);
  }

  static async getEngagementStats(payload: GetEngagementPayload): Promise<EngagementStats> {
    const res = await api.post(`${BASE}/getEngagement`, payload);
    return res.data;
  }

  static async deleteAnnouncement(payload: DeleteAnnouncementPayload): Promise<void> {
    await api.post(`${BASE}/delete`, payload);
  }

  // ── Approval routing (handover §4.4) ────────────────────────────────────

  /**
   * Call whenever `priority` changes in the composer. Drives the route stepper,
   * the forced-acknowledgement lock, and which primary action is offered.
   */
  static async previewRoute(payload: PreviewRoutePayload): Promise<ApprovalRoutePreview> {
    const res = await api.post(`${POLICY_BASE}/previewRoute`, payload);
    return res.data;
  }

  /** Every configured route at the site. Requires MANAGE. */
  static async listPolicies(payload: {
    organizationId: string;
    actorId: string;
  }): Promise<ApprovalPolicy[]> {
    const res = await api.post(`${POLICY_BASE}/list`, payload);
    return asList<ApprovalPolicy>(res.data);
  }

  /**
   * Replaces one priority's route. Requires MANAGE.
   *
   * NOTE: the controller resolves the tenant from `site` (not `organizationId`)
   * and takes the actor from `modifiedBy` — unlike every other endpoint here.
   */
  static async updatePolicy(payload: ApprovalPolicy): Promise<ApprovalPolicy> {
    const res = await api.post(`${POLICY_BASE}/update`, payload);
    return res.data;
  }

  static async submitForApproval(payload: AnnouncementActionPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/submitForApproval`, payload);
    return res.data;
  }

  /** Items awaiting *this* approver, across every level they hold. */
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
   * the fact. Requires APPROVE_TOP. Refusing sets status WITHDRAWN and
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
