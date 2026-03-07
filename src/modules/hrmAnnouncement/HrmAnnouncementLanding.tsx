"use client";

import React, { useEffect } from "react";
import { Tabs, message } from "antd";
import { parseCookies } from "nookies";
import CommonAppBar from "@/components/CommonAppBar";
import { useHrmAnnouncementStore } from "./stores/hrmAnnouncementStore";
import { HrmAnnouncementService } from "./services/hrmAnnouncementService";
import { useHrmAnnouncementData } from "./hooks/useHrmAnnouncementData";
import AnnouncementFeedTemplate from "./components/templates/AnnouncementFeedTemplate";
import AnnouncementAdminTemplate from "./components/templates/AnnouncementAdminTemplate";
import AnnouncementDetailPanel from "./components/organisms/AnnouncementDetailPanel";
import { Announcement } from "./types/domain.types";
import { ANNOUNCEMENT_HR_ROLES } from "./utils/constants";
import styles from "./styles/HrmAnnouncement.module.css";

const HrmAnnouncementLanding: React.FC = () => {
  const cookies = parseCookies();
  const site = cookies.site ?? "RITS";
  const employeeId = cookies.userId ?? "";
  const role = cookies.userRole ?? "EMPLOYEE";
  const canAdmin = ANNOUNCEMENT_HR_ROLES.includes(role);

  const {
    feed,
    pinnedAnnouncements,
    adminAnnouncements,
    selectedAnnouncement,
    feedLoading,
    adminLoading,
    showDetailPanel,
    showComposeDrawer,
    editAnnouncement,
    activeTab,
    filterCategory,
    filterPriority,
    setActiveTab,
    openDetailPanel,
    closeDetailPanel,
    openComposeDrawer,
    closeComposeDrawer,
    setFilterCategory,
    setFilterPriority,
    markAsRead,
    setPublishing,
    setWithdrawing,
  } = useHrmAnnouncementStore();

  const { loadFeed, loadAdminAnnouncements, loadEngagementStats } = useHrmAnnouncementData();

  useEffect(() => {
    loadFeed();
  }, [filterCategory, filterPriority]);

  useEffect(() => {
    if (activeTab === "admin" && canAdmin) {
      loadAdminAnnouncements();
    }
  }, [activeTab]);

  const handleMarkRead = async (announcementId: string) => {
    try {
      await HrmAnnouncementService.markRead({ site, announcementId, employeeId });
      markAsRead(announcementId);
    } catch {
      // silent
    }
  };

  const handleAnnouncementClick = (announcement: Announcement) => {
    openDetailPanel(announcement);
    if (!announcement.isRead) {
      handleMarkRead(announcement.id);
    }
  };

  const handlePublish = async (announcementId: string) => {
    setPublishing(true);
    try {
      await HrmAnnouncementService.publishAnnouncement({ site, announcementId });
      message.success("Announcement published");
      loadAdminAnnouncements();
    } catch {
      message.error("Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  const handleWithdraw = async (announcementId: string) => {
    setWithdrawing(true);
    try {
      await HrmAnnouncementService.withdrawAnnouncement({ site, announcementId });
      message.success("Announcement withdrawn");
      loadAdminAnnouncements();
    } catch {
      message.error("Failed to withdraw");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleViewStats = (announcement: Announcement) => {
    loadEngagementStats(announcement.id);
  };

  const handleDrawerSaved = () => {
    closeComposeDrawer();
    loadAdminAnnouncements();
    loadFeed();
  };

  const tabItems = [
    {
      key: "feed",
      label: "Announcements",
      children: (
        <AnnouncementFeedTemplate
          pinnedAnnouncements={pinnedAnnouncements}
          feed={feed}
          loading={feedLoading}
          filterCategory={filterCategory}
          filterPriority={filterPriority}
          onAnnouncementClick={handleAnnouncementClick}
          onCategoryFilter={setFilterCategory}
          onPriorityFilter={setFilterPriority}
        />
      ),
    },
  ];

  if (canAdmin) {
    tabItems.push({
      key: "admin",
      label: "Admin",
      children: (
        <AnnouncementAdminTemplate
          announcements={adminAnnouncements}
          loading={adminLoading}
          showComposeDrawer={showComposeDrawer}
          editAnnouncement={editAnnouncement}
          site={site}
          onEdit={(a: Announcement) => openComposeDrawer(a)}
          onPublish={handlePublish}
          onWithdraw={handleWithdraw}
          onViewStats={handleViewStats}
          onCreateNew={() => openComposeDrawer()}
          onDrawerClose={closeComposeDrawer}
          onDrawerSaved={handleDrawerSaved}
        />
      ),
    });
  }

  return (
    <div className={styles.landing}>
      <CommonAppBar appTitle="Announcements" showBack={false} />
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as "feed" | "admin")}
        items={tabItems}
        style={{ flex: 1, overflow: "hidden", padding: "0 24px" }}
      />
      {showDetailPanel && selectedAnnouncement && (
        <AnnouncementDetailPanel
          announcement={selectedAnnouncement}
          onClose={closeDetailPanel}
          onMarkRead={handleMarkRead}
        />
      )}
    </div>
  );
};

export default HrmAnnouncementLanding;
