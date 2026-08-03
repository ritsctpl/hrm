"use client";

import { useCallback } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { message } from "antd";
import { useEmployeeIdentity } from "@/modules/hrmAccess/hooks/useEmployeeIdentity";
import { parseAnnouncementError } from "../utils/announcementErrors";
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

  const organizationId = getOrganizationId();
  // Employee CODE, never the raw cookie — the backend matches audience by code.
  const { employeeCode, isReady } = useEmployeeIdentity();

  const loadFeed = useCallback(async () => {
    // Both calls are audience-scoped; firing them with a blank code returns
    // nothing at best and 500s at worst.
    if (!isReady || !employeeCode) return;
    setFeedLoading(true);
    try {
      const [feed, pinned] = await Promise.all([
        // category/priority are ARRAYS server-side; a bare string 500s.
        HrmAnnouncementService.getFeed({
          organizationId,
          employeeCode,
          category: filterCategory ? [filterCategory] : undefined,
          priority: filterPriority ? [filterPriority] : undefined,
        }),
        HrmAnnouncementService.getPinned({ organizationId, employeeCode }),
      ]);
      setFeed(feed);
      setPinnedAnnouncements(pinned);
    } catch {
      message.error("Failed to load announcements");
    } finally {
      setFeedLoading(false);
    }
  }, [organizationId, employeeCode, isReady, filterCategory, filterPriority]);

  // Both of these became permission-checked on 2026-07-31 — actorId is now
  // mandatory, and without it the server answers 400 HRM_ANN_ACTOR_REQUIRED.
  const loadAdminAnnouncements = useCallback(async () => {
    if (!isReady || !employeeCode) return;
    setAdminLoading(true);
    try {
      const data = await HrmAnnouncementService.listAnnouncements({
        organizationId,
        actorId: employeeCode,
      });
      setAdminAnnouncements(data);
    } catch (err) {
      message.error(
        parseAnnouncementError(err, "Failed to load admin announcements").message
      );
    } finally {
      setAdminLoading(false);
    }
  }, [organizationId, employeeCode, isReady]);

  const loadEngagementStats = useCallback(
    async (announcementHandle: string) => {
      if (!isReady || !employeeCode) return;
      setEngagementLoading(true);
      try {
        const stats = await HrmAnnouncementService.getEngagementStats({
          organizationId,
          announcementHandle,
          actorId: employeeCode,
        });
        setEngagementStats(stats);
      } catch {
        // Silent: the panel is supplementary, and REPORT/MANAGE is not
        // universal — a denial here shouldn't interrupt reading.
      } finally {
        setEngagementLoading(false);
      }
    },
    [organizationId, employeeCode, isReady]
  );

  return { organizationId, employeeCode, isReady, loadFeed, loadAdminAnnouncements, loadEngagementStats };
};
