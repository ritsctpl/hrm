/**
 * HRM Notification Module - Helper utilities
 */

import type { Notification } from '../types/domain.types';
import { TYPE_COLOR_MAP } from './notificationConstants';

/**
 * Returns a color hex for a notification type.
 */
export function getTypeColor(type: string): string {
  return TYPE_COLOR_MAP[type] ?? '#8c8c8c';
}

/**
 * Returns an emoji icon character for the notification type.
 * Used as a lightweight icon without importing heavy icon libraries.
 */
export function getTypeEmoji(type: string): string {
  const map: Record<string, string> = {
    LEAVE_APPROVED: '✅',
    LEAVE_REJECTED: '❌',
    EXPENSE_SUBMITTED: '📄',
    EXPENSE_APPROVED: '💳',
    PAYROLL_PUBLISHED: '💰',
    PAYSLIP_READY: '💰',
    ASSET_ALLOCATED: '📦',
    ANNOUNCEMENT: '📣',
    APPRAISAL_DUE: '⭐',
    POLICY_PUBLISHED: '📋',
    SYSTEM: '🔔',
  };
  return map[type] ?? '🔔';
}

/**
 * Builds a deep-link URL from a notification's type and metadata.
 * Returns null if no deep link can be determined.
 */
export function getDeepLink(notification: Notification): string | null {
  const meta = notification.metadata ?? {};
  const base = '/rits';

  switch (notification.type) {
    case 'LEAVE_APPROVED':
    case 'LEAVE_REJECTED': {
      const requestId = meta.requestId as string | undefined;
      return requestId
        ? `${base}/hrm_leave_app?requestId=${requestId}`
        : `${base}/hrm_leave_app`;
    }
    case 'EXPENSE_SUBMITTED':
    case 'EXPENSE_APPROVED': {
      const reportId = meta.reportId as string | undefined;
      return reportId
        ? `${base}/hrm_expense_app?reportId=${reportId}`
        : `${base}/hrm_expense_app`;
    }
    case 'PAYROLL_PUBLISHED':
    case 'PAYSLIP_READY': {
      return `${base}/hrm_payslip_app`;
    }
    case 'ASSET_ALLOCATED': {
      const assetId = meta.assetId as string | undefined;
      return assetId
        ? `${base}/hrm_asset_app?assetId=${assetId}`
        : `${base}/hrm_asset_app`;
    }
    case 'ANNOUNCEMENT': {
      const announcementId = meta.announcementId as string | undefined;
      return announcementId
        ? `${base}/hrm_announcement_app?announcementId=${announcementId}`
        : `${base}/hrm_announcement_app`;
    }
    case 'APPRAISAL_DUE': {
      const cycleId = meta.cycleId as string | undefined;
      return cycleId
        ? `${base}/hrm_appraisal_app?cycleId=${cycleId}`
        : `${base}/hrm_appraisal_app`;
    }
    case 'POLICY_PUBLISHED': {
      return `${base}/hrm_policy_app?tab=policies`;
    }
    default:
      return null;
  }
}

/**
 * Returns a relative time string using simple logic (no dayjs dependency for this util).
 */
export function getRelativeTime(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
