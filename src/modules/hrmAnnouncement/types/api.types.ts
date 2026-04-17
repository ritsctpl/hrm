import { AnnouncementPriority, AnnouncementCategory, AnnouncementStatus } from "./domain.types";

export interface GetAnnouncementsPayload {
  organizationId: string;
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
  organizationId: string;
  announcementHandle: string;
}

export interface ListAnnouncementsPayload {
  organizationId: string;
  status?: string;
  category?: string;
  page?: number;
  size?: number;
}

export interface MarkReadPayload {
  organizationId: string;
  announcementHandle: string;
  employeeId: string;
  readVia?: string;
}

export interface CreateAnnouncementPayload {
  organizationId: string;
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
  organizationId: string;
  announcementHandle: string;
}

export interface PublishAnnouncementPayload {
  organizationId: string;
  announcementHandle: string;
  publishedBy?: string;
}

export interface WithdrawAnnouncementPayload {
  organizationId: string;
  announcementHandle: string;
  withdrawnBy?: string;
  reason?: string;
}

export interface DeleteAnnouncementPayload {
  organizationId: string;
  announcementId: string;
  deletedBy: string;
}

export interface GetEngagementPayload {
  organizationId: string;
  announcementHandle: string;
}

export interface GetPinnedPayload {
  organizationId: string;
}
