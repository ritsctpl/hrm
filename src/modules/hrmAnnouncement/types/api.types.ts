import { AnnouncementPriority, AnnouncementCategory, AnnouncementStatus } from "./domain.types";

export interface GetAnnouncementsPayload {
  site: string;
  employeeId?: string;
  category?: AnnouncementCategory;
  priority?: AnnouncementPriority;
  status?: AnnouncementStatus;
  page?: number;
  size?: number;
}

export interface GetAnnouncementDetailPayload {
  site: string;
  announcementId: string;
  employeeId?: string;
}

export interface MarkReadPayload {
  site: string;
  announcementId: string;
  employeeId: string;
}

export interface CreateAnnouncementPayload {
  site: string;
  title: string;
  content: string;
  summary?: string;
  priority: AnnouncementPriority;
  category: AnnouncementCategory;
  isPinned?: boolean;
  scheduledAt?: string;
  expiresAt?: string;
  targetAudience?: string[];
}

export interface UpdateAnnouncementPayload extends Partial<CreateAnnouncementPayload> {
  announcementId: string;
}

export interface PublishAnnouncementPayload {
  site: string;
  announcementId: string;
}

export interface WithdrawAnnouncementPayload {
  site: string;
  announcementId: string;
  reason?: string;
}

export interface DeleteAnnouncementPayload {
  site: string;
  handle: string;
  deletedBy: string;
}

export interface DownloadAttachmentPayload {
  site: string;
  handle: string;
  attachmentId: string;
}

export interface SendReadReminderPayload {
  site: string;
  handle: string;
  employeeIds: string[];
  sentBy: string;
}
