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
    site: string,
    recipientId: string,
    page: number = 0,
    size: number = 20
  ): Promise<NotificationResponse[]> {
    const res = await api.post(`${this.BASE}/my-notifications`, {
      site,
      recipientId,
      page,
      size,
    });
    return res.data;
  }

  static async markAsRead(
    site: string,
    notificationId: string
  ): Promise<NotificationResponse> {
    const res = await api.post(`${this.BASE}/mark-read`, { site, notificationId });
    return res.data;
  }

  static async markAllAsRead(site: string, recipientId: string): Promise<void> {
    await api.post(`${this.BASE}/mark-all-read`, { site, recipientId });
  }

  static async getUnreadCount(site: string, recipientId: string): Promise<number> {
    const res = await api.post(`${this.BASE}/count-unread`, { site, recipientId });
    return (res.data as UnreadCountResponse).unreadCount;
  }

  // Send Notification (Admin / System)
  static async sendNotification(request: {
    site: string;
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
