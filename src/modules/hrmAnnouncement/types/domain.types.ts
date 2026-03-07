export type AnnouncementPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type AnnouncementCategory =
  | "GENERAL"
  | "HR"
  | "IT"
  | "FINANCE"
  | "OPERATIONS"
  | "SAFETY"
  | "EVENTS";
export type AnnouncementStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "WITHDRAWN";

export interface AnnouncementAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
}

export interface Announcement {
  id: string;
  site: string;
  title: string;
  content: string;
  summary?: string;
  priority: AnnouncementPriority;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  isPinned: boolean;
  isRead?: boolean;
  publishedAt?: string;
  scheduledAt?: string;
  expiresAt?: string;
  publishedBy?: string;
  targetAudience?: string[];
  attachments?: AnnouncementAttachment[];
  readCount?: number;
  totalRecipients?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface EngagementStats {
  announcementId: string;
  totalRecipients: number;
  readCount: number;
  readPercentage: number;
  readByDepartment?: Record<string, { read: number; total: number }>;
}
