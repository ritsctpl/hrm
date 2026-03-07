"use client";

import React from "react";
import { Select, Space } from "antd";
import { Announcement } from "../../types/domain.types";
import AnnouncementFeed from "../organisms/AnnouncementFeed";
import styles from "../../styles/HrmAnnouncement.module.css";

const { Option } = Select;

interface AnnouncementFeedTemplateProps {
  pinnedAnnouncements: Announcement[];
  feed: Announcement[];
  loading: boolean;
  filterCategory: string;
  filterPriority: string;
  onAnnouncementClick: (announcement: Announcement) => void;
  onCategoryFilter: (v: string) => void;
  onPriorityFilter: (v: string) => void;
}

const AnnouncementFeedTemplate: React.FC<AnnouncementFeedTemplateProps> = ({
  pinnedAnnouncements,
  feed,
  loading,
  filterCategory,
  filterPriority,
  onAnnouncementClick,
  onCategoryFilter,
  onPriorityFilter,
}) => (
  <div className={styles.feedTemplate}>
    <div className={styles.feedToolbar}>
      <Space>
        <Select
          placeholder="Category"
          value={filterCategory || undefined}
          allowClear
          onChange={(v) => onCategoryFilter(v || "")}
          style={{ width: 140 }}
        >
          <Option value="GENERAL">General</Option>
          <Option value="HR">HR</Option>
          <Option value="IT">IT</Option>
          <Option value="FINANCE">Finance</Option>
          <Option value="OPERATIONS">Operations</Option>
          <Option value="SAFETY">Safety</Option>
          <Option value="EVENTS">Events</Option>
        </Select>
        <Select
          placeholder="Priority"
          value={filterPriority || undefined}
          allowClear
          onChange={(v) => onPriorityFilter(v || "")}
          style={{ width: 120 }}
        >
          <Option value="LOW">Low</Option>
          <Option value="MEDIUM">Medium</Option>
          <Option value="HIGH">High</Option>
          <Option value="URGENT">Urgent</Option>
        </Select>
      </Space>
    </div>
    <AnnouncementFeed
      pinnedAnnouncements={pinnedAnnouncements}
      feed={feed}
      loading={loading}
      onAnnouncementClick={onAnnouncementClick}
    />
  </div>
);

export default AnnouncementFeedTemplate;
