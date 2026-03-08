import { AnnouncementPriority, AnnouncementCategory, AnnouncementStatus } from "../types/domain.types";

export const PRIORITY_COLORS: Record<AnnouncementPriority, string> = {
  NORMAL: "default",
  HIGH: "orange",
  URGENT: "red",
};

export const CATEGORY_COLORS: Record<AnnouncementCategory, string> = {
  GENERAL: "default",
  HOLIDAY: "blue",
  POLICY_UPDATE: "geekblue",
  TRAINING: "gold",
  EVENT: "purple",
  EMERGENCY: "red",
  BENEFITS: "green",
  FACILITIES: "cyan",
};

export const STATUS_COLORS: Record<AnnouncementStatus, string> = {
  DRAFT: "default",
  PUBLISHED: "success",
  SCHEDULED: "processing",
  WITHDRAWN: "warning",
  EXPIRED: "error",
};

export const ANNOUNCEMENT_HR_ROLES = ["HR", "HR_MANAGER", "ADMIN", "SUPERADMIN"];

export const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  GENERAL: "General",
  HOLIDAY: "Holiday",
  POLICY_UPDATE: "Policy Update",
  TRAINING: "Training",
  EVENT: "Event",
  EMERGENCY: "Emergency",
  BENEFITS: "Benefits",
  FACILITIES: "Facilities",
};
