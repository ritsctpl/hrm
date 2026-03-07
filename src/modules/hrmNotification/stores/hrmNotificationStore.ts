/**
 * HRM Notification Module - Zustand Store
 */

import { create } from 'zustand';
import type { Notification } from '../types/domain.types';

interface HrmNotificationState {
  notifications: Notification[];
  popoverNotifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
  currentPage: number;
  isPopoverOpen: boolean;
  filterType: string;
  filterRead: 'all' | 'unread';
  loadingNotifications: boolean;
  loadingPopover: boolean;
  markingRead: boolean;
  markingAllRead: boolean;

  setNotifications: (items: Notification[]) => void;
  appendNotifications: (items: Notification[]) => void;
  setPopoverNotifications: (items: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  decrementUnreadCount: () => void;
  clearUnreadCount: () => void;
  setHasMore: (v: boolean) => void;
  setCurrentPage: (page: number) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllRead: () => void;
  setPopoverOpen: (v: boolean) => void;
  setFilterType: (type: string) => void;
  setFilterRead: (v: 'all' | 'unread') => void;
  setLoadingNotifications: (v: boolean) => void;
  setLoadingPopover: (v: boolean) => void;
  setMarkingRead: (v: boolean) => void;
  setMarkingAllRead: (v: boolean) => void;
  reset: () => void;
}

const defaultState = {
  notifications: [] as Notification[],
  popoverNotifications: [] as Notification[],
  unreadCount: 0,
  hasMore: false,
  currentPage: 0,
  isPopoverOpen: false,
  filterType: '',
  filterRead: 'all' as const,
  loadingNotifications: false,
  loadingPopover: false,
  markingRead: false,
  markingAllRead: false,
};

export const useHrmNotificationStore = create<HrmNotificationState>((set) => ({
  ...defaultState,

  setNotifications: (notifications) => set({ notifications }),
  appendNotifications: (items) =>
    set((s) => ({ notifications: [...s.notifications, ...items] })),
  setPopoverNotifications: (popoverNotifications) => set({ popoverNotifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  decrementUnreadCount: () =>
    set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
  clearUnreadCount: () => set({ unreadCount: 0 }),
  setHasMore: (hasMore) => set({ hasMore }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  markNotificationRead: (notificationId) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
      popoverNotifications: s.popoverNotifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      popoverNotifications: s.popoverNotifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  setPopoverOpen: (isPopoverOpen) => set({ isPopoverOpen }),
  setFilterType: (filterType) =>
    set({ filterType, currentPage: 0, notifications: [] }),
  setFilterRead: (filterRead) =>
    set({ filterRead, currentPage: 0, notifications: [] }),
  setLoadingNotifications: (v) => set({ loadingNotifications: v }),
  setLoadingPopover: (v) => set({ loadingPopover: v }),
  setMarkingRead: (v) => set({ markingRead: v }),
  setMarkingAllRead: (v) => set({ markingAllRead: v }),
  reset: () => set(defaultState),
}));
