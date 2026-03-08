"use client";

import React from "react";
import { Typography, Empty, Spin, Divider } from "antd";
import { PushpinOutlined } from "@ant-design/icons";
import { Announcement } from "../../types/domain.types";
import AnnouncementListRow from "../molecules/AnnouncementListRow";
import styles from "../../styles/HrmAnnouncement.module.css";

interface AnnouncementFeedProps {
  pinnedAnnouncements: Announcement[];
  feed: Announcement[];
  loading: boolean;
  onAnnouncementClick: (announcement: Announcement) => void;
}

const AnnouncementFeed: React.FC<AnnouncementFeedProps> = ({
  pinnedAnnouncements,
  feed,
  loading,
  onAnnouncementClick,
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

  return (
    <div className={styles.feedContainer}>
      {hasPinned && (
        <>
          <div className={styles.feedSectionHeader}>
            <PushpinOutlined style={{ color: "#faad14", marginRight: 6 }} />
            <Typography.Text strong>Pinned</Typography.Text>
          </div>
          {pinnedAnnouncements.map((a) => (
            <AnnouncementListRow
              key={a.handle}
              announcement={a}
              onClick={onAnnouncementClick}
            />
          ))}
          <Divider style={{ margin: "8px 0" }} />
        </>
      )}
      {hasFeed && (
        <>
          <div className={styles.feedSectionHeader}>
            <Typography.Text strong>Latest</Typography.Text>
          </div>
          {feed.map((a) => (
            <AnnouncementListRow
              key={a.handle}
              announcement={a}
              onClick={onAnnouncementClick}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default AnnouncementFeed;
