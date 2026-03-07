"use client";

import React from "react";
import { Card, Typography, Space } from "antd";
import { PushpinOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Announcement } from "../../types/domain.types";
import { AnnouncementCardProps } from "../../types/ui.types";
import AnnouncementPriorityTag from "../atoms/AnnouncementPriorityTag";
import AnnouncementCategoryBadge from "../atoms/AnnouncementCategoryBadge";
import ReadStatusDot from "../atoms/ReadStatusDot";
import styles from "../../styles/HrmAnnouncement.module.css";

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement, onClick }) => (
  <Card
    hoverable
    className={`${styles.announcementCard} ${announcement.isPinned ? styles.pinned : ""} ${!announcement.isRead ? styles.unread : ""}`}
    onClick={() => onClick(announcement)}
    size="small"
  >
    <div className={styles.cardHeader}>
      <Space>
        {announcement.isPinned && <PushpinOutlined style={{ color: "#faad14" }} />}
        <ReadStatusDot isRead={announcement.isRead} />
        <AnnouncementPriorityTag priority={announcement.priority} />
        <AnnouncementCategoryBadge category={announcement.category} />
      </Space>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {announcement.publishedAt ? dayjs(announcement.publishedAt).fromNow() : ""}
      </Text>
    </div>
    <Title level={5} className={styles.cardTitle} ellipsis={{ rows: 2 }}>
      {announcement.title}
    </Title>
    {announcement.summary && (
      <Text type="secondary" className={styles.cardSummary} ellipsis>
        {announcement.summary}
      </Text>
    )}
  </Card>
);

export default AnnouncementCard;
