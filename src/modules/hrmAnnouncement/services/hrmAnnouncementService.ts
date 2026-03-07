import api from "@/services/api";
import {
  GetAnnouncementsPayload,
  GetAnnouncementDetailPayload,
  MarkReadPayload,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
  PublishAnnouncementPayload,
  WithdrawAnnouncementPayload,
} from "../types/api.types";
import { Announcement, EngagementStats } from "../types/domain.types";

const BASE = "app/v1/hrm-service/announcement";

export class HrmAnnouncementService {
  static async getFeed(payload: GetAnnouncementsPayload): Promise<Announcement[]> {
    const res = await api.post(`${BASE}/feed`, payload);
    return res.data;
  }

  static async getPinned(site: string, employeeId: string): Promise<Announcement[]> {
    const res = await api.post(`${BASE}/pinned`, { site, employeeId });
    return res.data;
  }

  static async getDetail(payload: GetAnnouncementDetailPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/detail`, payload);
    return res.data;
  }

  static async markRead(payload: MarkReadPayload): Promise<void> {
    await api.post(`${BASE}/mark-read`, payload);
  }

  static async getAllForAdmin(site: string): Promise<Announcement[]> {
    const res = await api.post(`${BASE}/admin/list`, { site });
    return res.data;
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

  static async getEngagementStats(site: string, announcementId: string): Promise<EngagementStats> {
    const res = await api.post(`${BASE}/engagement`, { site, announcementId });
    return res.data;
  }
}
