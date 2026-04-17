"use client";

import { useCallback } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { message } from "antd";
import { parseCookies } from "nookies";
import { HrmAnnouncementService } from "../services/hrmAnnouncementService";
import { useHrmAnnouncementStore } from "../stores/hrmAnnouncementStore";

export const useHrmAnnouncementData = () => {
  const {
    filterCategory,
    filterPriority,
    setFeed,
    setPinnedAnnouncements,
    setAdminAnnouncements,
    setEngagementStats,
    setFeedLoading,
    setAdminLoading,
    setEngagementLoading,
  } = useHrmAnnouncementStore();

  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const employeeId = cookies.userId ?? "";

  const loadFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const [feed, pinned] = await Promise.all([
        HrmAnnouncementService.getFeed({ organizationId,
          employeeId,
          category: filterCategory as never || undefined,
          priority: filterPriority as never || undefined,
          status: "PUBLISHED",
        }),
        HrmAnnouncementService.getPinned(organizationId),
      ]);
      setFeed(feed);
      setPinnedAnnouncements(pinned);
    } catch {
      message.error("Failed to load announcements");
    } finally {
      setFeedLoading(false);
    }
  }, [organizationId, employeeId, filterCategory, filterPriority]);

  const loadAdminAnnouncements = useCallback(async () => {
    setAdminLoading(true);
    try {
      const data = await HrmAnnouncementService.listAnnouncements({ organizationId });
      setAdminAnnouncements(data);
    } catch {
      message.error("Failed to load admin announcements");
    } finally {
      setAdminLoading(false);
    }
  }, [organizationId]);

  const loadEngagementStats = useCallback(async (announcementHandle: string) => {
    setEngagementLoading(true);
    try {
      const stats = await HrmAnnouncementService.getEngagementStats({ organizationId, announcementHandle });
      setEngagementStats(stats);
    } catch {
      // silent
    } finally {
      setEngagementLoading(false);
    }
  }, [organizationId]);

  return { organizationId, employeeId, loadFeed, loadAdminAnnouncements, loadEngagementStats };
};
