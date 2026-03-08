import { AnnouncementPriority, AnnouncementCategory, AnnouncementStatus } from "./domain.types";

export interface GetAnnouncementsPayload {
  site: string;
  employeeId?: string;
  department?: string;
  role?: string;
  category?: AnnouncementCategory;
  priority?: AnnouncementPriority;
  status?: AnnouncementStatus;
  page?: number;
  size?: number;
}

export interface GetAnnouncementDetailPayload {
  site: string;
  announcementHandle: string;
}

export interface ListAnnouncementsPayload {
  site: string;
  status?: string;
  category?: string;
  page?: number;
  size?: number;
}

export interface MarkReadPayload {
  site: string;
  announcementHandle: string;
  employeeId: string;
  readVia?: string;
}

export interface CreateAnnouncementPayload {
  site: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority?: AnnouncementPriority;
  scheduledPublishAt?: string;
  expiresAt?: string;
  allEmployees?: boolean;
  targetDepartments?: string[];
  targetBusinessUnits?: string[];
  targetRoles?: string[];
  targetEmployeeIds?: string[];
  sendEmailNotification?: boolean;
  sendPushNotification?: boolean;
  pinToTop?: boolean;
  pinnedUntil?: string;
  createdBy?: string;
}

export interface UpdateAnnouncementPayload extends Partial<CreateAnnouncementPayload> {
  site: string;
  announcementHandle: string;
}

export interface PublishAnnouncementPayload {
  site: string;
  announcementHandle: string;
  publishedBy?: string;
}

export interface WithdrawAnnouncementPayload {
  site: string;
  announcementHandle: string;
  withdrawnBy?: string;
  reason?: string;
}

export interface DeleteAnnouncementPayload {
  site: string;
  announcementId: string;
  deletedBy: string;
}

export interface GetEngagementPayload {
  site: string;
  announcementHandle: string;
}

export interface GetPinnedPayload {
  site: string;
}
