import { AnnouncementPriority, AnnouncementCategory, AnnouncementStatus } from "../types/domain.types";

export const PRIORITY_COLORS: Record<AnnouncementPriority, string> = {
  LOW: "default",
  MEDIUM: "blue",
  HIGH: "orange",
  URGENT: "red",
};

export const CATEGORY_COLORS: Record<AnnouncementCategory, string> = {
  GENERAL: "default",
  HR: "blue",
  IT: "geekblue",
  FINANCE: "gold",
  OPERATIONS: "green",
  SAFETY: "red",
  EVENTS: "purple",
};

export const STATUS_COLORS: Record<AnnouncementStatus, string> = {
  DRAFT: "default",
  PUBLISHED: "success",
  SCHEDULED: "processing",
  WITHDRAWN: "warning",
};

export const ANNOUNCEMENT_HR_ROLES = ["HR", "HR_MANAGER", "ADMIN", "SUPERADMIN"];

export const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  GENERAL: "General",
  HR: "HR",
  IT: "IT",
  FINANCE: "Finance",
  OPERATIONS: "Operations",
  SAFETY: "Safety",
  EVENTS: "Events",
};
