'use client';

import { useEffect } from 'react';
import { parseCookies } from 'nookies';
import { HrmNotificationService } from '../services/hrmNotificationService';
import { useHrmNotificationStore } from '../stores/hrmNotificationStore';
import { POLLING_INTERVAL_MS } from '../utils/notificationConstants';

/**
 * Polls the unread notification count every 60 seconds.
 * Designed to be mounted once in CommonAppBar / app layout.
 */
export function useNotificationPolling() {
  const { setUnreadCount } = useHrmNotificationStore();

  useEffect(() => {
    const { site, employeeId, userId } = parseCookies();
    const recipientId = employeeId ?? userId ?? '';
    if (!site || !recipientId) return;

    const fetchCount = async () => {
      try {
        const count = await HrmNotificationService.getUnreadCount(site, recipientId);
        setUnreadCount(count);
      } catch {
        // silent — polling errors must not surface
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [setUnreadCount]);
}
