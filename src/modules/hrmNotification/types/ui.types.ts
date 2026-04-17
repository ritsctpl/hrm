/**
 * HRM Notification Module - UI Types
 */

import type { Notification } from './domain.types';

export interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDeepLink?: (notification: Notification) => void;
  compact?: boolean;
}

export interface NotificationBellProps {
  organizationId: string;
  recipientId: string;
}

export interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export interface NotificationPopoverHeaderProps {
  onMarkAllRead: () => void;
  loading: boolean;
  unreadCount: number;
}

export interface NotificationEmptyStateProps {
  hasFilter: boolean;
  onClearFilter?: () => void;
}
