/**
 * HRM Notification Module - API Types
 */

export interface NotificationResponse {
  id: string;
  site: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface GetMyNotificationsPayload {
  site: string;
  recipientId: string;
  page: number;
  size: number;
}

export interface MarkReadPayload {
  site: string;
  notificationId: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface DeleteNotificationPayload {
  site: string;
  handle: string;
}

export interface NotificationPreferences {
  userId: string;
  site: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  categories: Record<string, boolean>;
}

export interface UpdatePreferencesPayload {
  site: string;
  userId: string;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
  categories?: Record<string, boolean>;
}
