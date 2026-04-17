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
  readAt?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface GetMyNotificationsPayload {
  organizationId: string;
  recipientId: string;
  page?: number;
  size?: number;
}

export interface MarkReadPayload {
  organizationId: string;
  notificationId: string;
}

export interface MarkAllReadPayload {
  organizationId: string;
  recipientId: string;
}

export interface CountUnreadPayload {
  organizationId: string;
  recipientId: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface SendNotificationPayload {
  organizationId: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}
