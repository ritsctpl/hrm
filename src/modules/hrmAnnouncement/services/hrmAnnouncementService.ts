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
} from "../types/api.types";
import { Announcement, EngagementStats } from "../types/domain.types";

const BASE = "/hrm-service/policy";

export class HrmAnnouncementService {
  static async getFeed(payload: GetAnnouncementsPayload): Promise<Announcement[]> {
    const res = await api.post(`${BASE}/getMyAnnouncements`, payload);
    return res.data;
  }

  static async getPinned(organizationId: string): Promise<Announcement[]> {
    const res = await api.post(`${BASE}/getPinnedAnnouncements`, { organizationId });
    return res.data;
  }

  static async getDetail(payload: GetAnnouncementDetailPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/getAnnouncement`, payload);
    return res.data;
  }

  static async markRead(payload: MarkReadPayload): Promise<void> {
    await api.post(`${BASE}/markAsRead`, payload);
  }

  static async listAnnouncements(payload: ListAnnouncementsPayload): Promise<Announcement[]> {
    const res = await api.post(`${BASE}/listAnnouncements`, payload);
    return res.data;
  }

  static async createAnnouncement(payload: CreateAnnouncementPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/createAnnouncement`, payload);
    return res.data;
  }

  static async updateAnnouncement(payload: UpdateAnnouncementPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/updateAnnouncement`, payload);
    return res.data;
  }

  static async publishAnnouncement(payload: PublishAnnouncementPayload): Promise<void> {
    await api.post(`${BASE}/publishAnnouncement`, payload);
  }

  static async withdrawAnnouncement(payload: WithdrawAnnouncementPayload): Promise<void> {
    await api.post(`${BASE}/withdrawAnnouncement`, payload);
  }

  static async getEngagementStats(payload: GetEngagementPayload): Promise<EngagementStats> {
    const res = await api.post(`${BASE}/getAnnouncementEngagement`, payload);
    return res.data;
  }

  static async deleteAnnouncement(payload: DeleteAnnouncementPayload): Promise<void> {
    await api.post(`${BASE}/deleteAnnouncement`, payload);
  }

  static async processScheduledPublishing(organizationId: string): Promise<void> {
    await api.post(`${BASE}/processScheduledPublishing`, { organizationId });
  }

  static async processExpiredAnnouncements(organizationId: string): Promise<void> {
    await api.post(`${BASE}/processExpiredAnnouncements`, { organizationId });
  }
}
