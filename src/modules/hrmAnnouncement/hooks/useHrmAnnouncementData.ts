"use client";

import { useCallback } from "react";
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
  const site = cookies.site ?? "RITS";
  const employeeId = cookies.userId ?? "";

  const loadFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const [feed, pinned] = await Promise.all([
        HrmAnnouncementService.getFeed({
          site,
          employeeId,
          category: filterCategory as never || undefined,
          priority: filterPriority as never || undefined,
          status: "PUBLISHED",
        }),
        HrmAnnouncementService.getPinned(site, employeeId),
      ]);
      setFeed(feed);
      setPinnedAnnouncements(pinned);
    } catch {
      message.error("Failed to load announcements");
    } finally {
      setFeedLoading(false);
    }
  }, [site, employeeId, filterCategory, filterPriority]);

  const loadAdminAnnouncements = useCallback(async () => {
    setAdminLoading(true);
    try {
      const data = await HrmAnnouncementService.getAllForAdmin(site);
      setAdminAnnouncements(data);
    } catch {
      message.error("Failed to load admin announcements");
    } finally {
      setAdminLoading(false);
    }
  }, [site]);

  const loadEngagementStats = useCallback(async (announcementId: string) => {
    setEngagementLoading(true);
    try {
      const stats = await HrmAnnouncementService.getEngagementStats(site, announcementId);
      setEngagementStats(stats);
    } catch {
      // silent
    } finally {
      setEngagementLoading(false);
    }
  }, [site]);

  return { site, employeeId, loadFeed, loadAdminAnnouncements, loadEngagementStats };
};
