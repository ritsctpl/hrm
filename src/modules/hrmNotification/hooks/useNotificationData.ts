'use client';

import { useCallback } from 'react';
import { message } from 'antd';
import { parseCookies } from 'nookies';
import { HrmNotificationService } from '../services/hrmNotificationService';
import { useHrmNotificationStore } from '../stores/hrmNotificationStore';
import type { Notification } from '../types/domain.types';
import { PAGE_SIZE } from '../utils/notificationConstants';

export function useNotificationData() {
  const store = useHrmNotificationStore();

  const getSiteAndUser = () => {
    const cookies = parseCookies();
    return {
      site: cookies.site ?? '',
      recipientId: cookies.employeeId ?? cookies.userId ?? '',
    };
  };

  const loadNotifications = useCallback(
    async (page: number, replace: boolean) => {
      const { site, recipientId } = getSiteAndUser();
      const { filterType, filterRead } = useHrmNotificationStore.getState();
      store.setLoadingNotifications(true);
      try {
        const data = await HrmNotificationService.getMyNotifications(
          site,
          recipientId,
          page,
          PAGE_SIZE,
          filterType || undefined,
          filterRead === 'unread' ? false : undefined
        );
        const mapped: Notification[] = data.map((d) => ({
          ...d,
          type: d.type,
        }));
        if (replace) {
          store.setNotifications(mapped);
        } else {
          store.appendNotifications(mapped);
        }
        store.setHasMore(data.length === PAGE_SIZE);
        store.setCurrentPage(page);
      } catch {
        message.error('Failed to load notifications');
      } finally {
        store.setLoadingNotifications(false);
      }
    },
    []
  );

  const loadPopoverNotifications = useCallback(async () => {
    const { site, recipientId } = getSiteAndUser();
    store.setLoadingPopover(true);
    try {
      const data = await HrmNotificationService.getMyNotifications(site, recipientId, 0, 5);
      const mapped: Notification[] = data.map((d) => ({
        ...d,
        type: d.type,
      }));
      store.setPopoverNotifications(mapped);
    } catch {
      store.setPopoverNotifications([]);
    } finally {
      store.setLoadingPopover(false);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    const { site, recipientId } = getSiteAndUser();
    try {
      const count = await HrmNotificationService.getUnreadCount(site, recipientId);
      store.setUnreadCount(count);
    } catch {
      // silent — polling errors should not surface to user
    }
  }, []);

  const handleMarkRead = useCallback(async (notificationId: string) => {
    const { site } = getSiteAndUser();
    try {
      await HrmNotificationService.markAsRead(site, notificationId);
      store.markNotificationRead(notificationId);
      store.decrementUnreadCount();
    } catch {
      message.error('Failed to mark notification as read');
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    const { site, recipientId } = getSiteAndUser();
    store.setMarkingAllRead(true);
    try {
      await HrmNotificationService.markAllAsRead(site, recipientId);
      store.markAllRead();
      const count = await HrmNotificationService.getUnreadCount(site, recipientId);
      store.setUnreadCount(count);
    } catch {
      message.error('Failed to mark all as read');
    } finally {
      store.setMarkingAllRead(false);
    }
  }, []);

  return {
    loadNotifications,
    loadPopoverNotifications,
    loadUnreadCount,
    handleMarkRead,
    handleMarkAllRead,
  };
}
