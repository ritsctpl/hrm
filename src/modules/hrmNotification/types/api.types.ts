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
