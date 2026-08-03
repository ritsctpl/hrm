"use client";

import React from "react";
import { Typography, Empty, Spin, Divider } from "antd";
import { PushpinOutlined } from "@ant-design/icons";
import { Announcement } from "../../types/domain.types";
import AnnouncementFeedCard from "../molecules/AnnouncementFeedCard";
import styles from "../../styles/HrmAnnouncement.module.css";

interface AnnouncementFeedProps {
  pinnedAnnouncements: Announcement[];
  feed: Announcement[];
  loading: boolean;
  /** Full records by handle, filled in as cards come into view. */
  bodies: Record<string, Announcement>;
  loadingBodies: Record<string, boolean>;
  onNeedBody: (handle: string) => void;
  onRead: (handle: string) => void;
  onAcknowledge: (handle: string) => void;
  acknowledgingHandle?: string | null;
}

const AnnouncementFeed: React.FC<AnnouncementFeedProps> = ({
  pinnedAnnouncements,
  feed,
  loading,
  bodies,
  loadingBodies,
  onNeedBody,
  onRead,
  onAcknowledge,
  acknowledgingHandle,
}) => {
  if (loading) {
    return (
      <div className={styles.loadingCenter}>
        <Spin size="large" />
      </div>
    );
  }

  const hasPinned = pinnedAnnouncements.length > 0;
  const hasFeed = feed.length > 0;

  if (!hasPinned && !hasFeed) {
    return <Empty description="No announcements found" />;
  }

  const card = (a: Announcement) => (
    <AnnouncementFeedCard
      key={a.handle || a.announcementId}
      announcement={a}
      body={bodies[a.handle]}
      bodyLoading={!!loadingBodies[a.handle]}
      onNeedBody={onNeedBody}
      onRead={onRead}
      onAcknowledge={onAcknowledge}
      acknowledging={acknowledgingHandle === a.handle}
    />
  );

  return (
    <div className={styles.feedContainer}>
      {hasPinned && (
        <>
          <div className={styles.feedSectionHeader}>
            <PushpinOutlined style={{ color: "#faad14", marginRight: 6 }} />
            <Typography.Text strong>Pinned</Typography.Text>
          </div>
          {pinnedAnnouncements.map(card)}
          <Divider style={{ margin: "8px 0" }} />
        </>
      )}
      {hasFeed && (
        <>
          <div className={styles.feedSectionHeader}>
            <Typography.Text strong>Latest</Typography.Text>
          </div>
          {feed.map(card)}
        </>
      )}
    </div>
  );
};

export default AnnouncementFeed;
