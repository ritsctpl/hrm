/**
 * HRM Notification Module - Service Layer
 */

import api from '@/services/api';
import type {
  NotificationResponse,
  UnreadCountResponse,
  NotificationPreferences,
  UpdatePreferencesPayload,
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

  static async getUnreadTopFive(
    site: string,
    recipientId: string
  ): Promise<NotificationResponse[]> {
    const res = await api.post(`${this.BASE}/unread-top5`, { site, recipientId });
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

  static async deleteNotification(site: string, handle: string): Promise<void> {
    await api.post(`${this.BASE}/delete`, { site, handle });
  }

  static async getPreferences(
    site: string,
    userId: string
  ): Promise<NotificationPreferences> {
    const res = await api.post<NotificationPreferences>(`${this.BASE}/preferences/retrieve`, {
      site,
      userId,
    });
    return res.data;
  }

  static async updatePreferences(payload: UpdatePreferencesPayload): Promise<void> {
    await api.post(`${this.BASE}/preferences/update`, payload);
  }
}
