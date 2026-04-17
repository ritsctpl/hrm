/**
 * HRM Notification Module - Service Layer
 */

import api from '@/services/api';
import type {
  NotificationResponse,
  UnreadCountResponse,
} from '../types/api.types';

export class HrmNotificationService {
  private static readonly BASE = '/hrm-service/notification';

  static async getMyNotifications(
    organizationId: string,
    recipientId: string,
    page: number = 0,
    size: number = 20,
    type?: string,
    read?: boolean
  ): Promise<NotificationResponse[]> {
    const res = await api.post(`${this.BASE}/my-notifications`, {
      organizationId,
      recipientId,
      page,
      size,
      ...(type ? { type } : {}),
      ...(read !== undefined ? { read } : {}),
    });
    return res.data;
  }

  static async markAsRead(
    organizationId: string,
    notificationId: string
  ): Promise<NotificationResponse> {
    const res = await api.post(`${this.BASE}/mark-read`, { organizationId, notificationId });
    return res.data;
  }

  static async markAllAsRead(organizationId: string, recipientId: string): Promise<void> {
    await api.post(`${this.BASE}/mark-all-read`, { organizationId, recipientId });
  }

  static async getUnreadCount(organizationId: string, recipientId: string): Promise<number> {
    const res = await api.post(`${this.BASE}/count-unread`, { organizationId, recipientId });
    return (res.data as UnreadCountResponse).unreadCount;
  }

  // Send Notification (Admin / System)
  static async sendNotification(request: {
    organizationId: string;
    recipientId: string;
    type: string;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<NotificationResponse> {
    const res = await api.post(`${this.BASE}/send`, request);
    return res.data;
  }
}
