export type AnnouncementPriority = "NORMAL" | "HIGH" | "URGENT";
export type AnnouncementCategory =
  | "GENERAL"
  | "HOLIDAY"
  | "POLICY_UPDATE"
  | "TRAINING"
  | "EVENT"
  | "EMERGENCY"
  | "BENEFITS"
  | "FACILITIES";
export type AnnouncementStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "WITHDRAWN" | "EXPIRED";

export interface AnnouncementAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
}

export interface Announcement {
  handle: string;
  announcementId: string;
  site?: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  pinToTop: boolean;
  isRead?: boolean;
  publishedAt?: string;
  scheduledPublishAt?: string;
  expiresAt?: string;
  totalTargetEmployees?: number;
  readCount?: number;
  readRate?: number;
  attachments?: AnnouncementAttachment[];
  createdAt?: string;
  updatedAt?: string;
  messageDetails?: unknown;
}

export interface EngagementStats {
  announcementHandle: string;
  announcementId: string;
  title: string;
  status: AnnouncementStatus;
  totalTargetEmployees: number;
  readCount: number;
  readRate: number;
  publishedAt?: string;
}
