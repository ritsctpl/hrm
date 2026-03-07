"use client";

import React from "react";
import { Drawer } from "antd";
import { Announcement } from "./types/domain.types";
import AnnouncementDetailPanel from "./components/organisms/AnnouncementDetailPanel";
import EngagementStatsPanel from "./components/organisms/EngagementStatsPanel";
import { useHrmAnnouncementStore } from "./stores/hrmAnnouncementStore";

interface HrmAnnouncementScreenProps {
  announcement: Announcement;
  onClose: () => void;
  onMarkRead?: (announcementId: string) => void;
}

const HrmAnnouncementScreen: React.FC<HrmAnnouncementScreenProps> = ({
  announcement,
  onClose,
  onMarkRead,
}) => {
  const { engagementStats, engagementLoading } = useHrmAnnouncementStore();

  return (
    <>
      <AnnouncementDetailPanel
        announcement={announcement}
        onClose={onClose}
        onMarkRead={onMarkRead}
      />
      {engagementStats && (
        <EngagementStatsPanel stats={engagementStats} loading={engagementLoading} />
      )}
    </>
  );
};

export default HrmAnnouncementScreen;
