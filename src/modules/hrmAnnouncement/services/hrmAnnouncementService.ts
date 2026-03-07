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

const BASE = "/hrm-service/policy";

export class HrmAnnouncementService {
  static async getFeed(payload: GetAnnouncementsPayload): Promise<Announcement[]> {
    const res = await api.post(`${BASE}/getMyAnnouncements`, payload);
    return res.data;
  }

  static async getPinned(site: string, employeeId: string): Promise<Announcement[]> {
    const res = await api.post(`${BASE}/getPinnedAnnouncements`, { site, employeeId });
    return res.data;
  }

  static async getDetail(payload: GetAnnouncementDetailPayload): Promise<Announcement> {
    const res = await api.post(`${BASE}/getAnnouncement`, payload);
    return res.data;
  }

  static async markRead(payload: MarkReadPayload): Promise<void> {
    await api.post(`${BASE}/markAsRead`, payload);
  }

  static async getAllForAdmin(site: string): Promise<Announcement[]> {
    const res = await api.post(`${BASE}/listAnnouncements`, { site });
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

  static async getEngagementStats(site: string, announcementId: string): Promise<EngagementStats> {
    const res = await api.post(`${BASE}/getAnnouncementEngagement`, { site, announcementId });
    return res.data;
  }

  static async deleteAnnouncement(
    site: string,
    handle: string,
    deletedBy: string
  ): Promise<void> {
    await api.post(`${BASE}/deleteAnnouncement`, { site, handle, deletedBy });
  }

  static async downloadAttachment(
    site: string,
    handle: string,
    attachmentId: string
  ): Promise<Blob> {
    const res = await api.post(`${BASE}/downloadAttachment`, { site, handle, attachmentId }, {
      responseType: "blob",
    });
    return res.data as Blob;
  }

  static async sendReadReminder(
    site: string,
    handle: string,
    employeeIds: string[],
    sentBy: string
  ): Promise<void> {
    await api.post(`${BASE}/sendReadReminder`, { site, handle, employeeIds, sentBy });
  }
}
