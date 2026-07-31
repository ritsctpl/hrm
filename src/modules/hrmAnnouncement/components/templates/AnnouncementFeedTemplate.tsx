"use client";

import React from "react";
import { Select, Space, Button, Input } from "antd";
import { PlusOutlined, CheckOutlined } from "@ant-design/icons";
import { Announcement } from "../../types/domain.types";
import AnnouncementFeed from "../organisms/AnnouncementFeed";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmAnnouncement.module.css";

const { Option } = Select;

interface AnnouncementFeedTemplateProps {
  pinnedAnnouncements: Announcement[];
  feed: Announcement[];
  loading: boolean;
  filterCategory: string;
  filterPriority: string;
  canAdmin?: boolean;
  onAnnouncementClick: (announcement: Announcement) => void;
  onCategoryFilter: (v: string) => void;
  onPriorityFilter: (v: string) => void;
  onMarkAllRead?: () => void;
  onCreateNew?: () => void;
}

const AnnouncementFeedTemplate: React.FC<AnnouncementFeedTemplateProps> = ({
  pinnedAnnouncements,
  feed,
  loading,
  filterCategory,
  filterPriority,
  canAdmin,
  onAnnouncementClick,
  onCategoryFilter,
  onPriorityFilter,
  onMarkAllRead,
  onCreateNew,
}) => {
  // Belt-and-braces: the service normalizes list shapes, but a rendering crash
  // here takes the whole module down, so never assume these are arrays.
  const feedItems = Array.isArray(feed) ? feed : [];
  const pinnedItems = Array.isArray(pinnedAnnouncements) ? pinnedAnnouncements : [];

  const unreadCount = [...feedItems, ...pinnedItems].filter(
    (a) => !a.isRead
  ).length;

  return (
    <div className={styles.feedTemplate}>
      <div className={styles.feedToolbar}>
        <Space wrap>
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
            <Option value="GENERAL">General</Option>
            <Option value="IMPORTANT">Important</Option>
            <Option value="CRITICAL">Critical</Option>
            <Option value="EMERGENCY">Emergency</Option>
          </Select>
          {onMarkAllRead && unreadCount > 0 && (
            <Button
              size="small"
              icon={<CheckOutlined />}
              onClick={onMarkAllRead}
            >
              Mark All as Read ({unreadCount})
            </Button>
          )}
        </Space>
        {canAdmin && onCreateNew && (
          <Can I="add">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onCreateNew}
              style={{ marginLeft: "auto" }}
            >
              New Announcement
            </Button>
          </Can>
        )}
      </div>
      <AnnouncementFeed
        pinnedAnnouncements={pinnedItems}
        feed={feedItems}
        loading={loading}
        onAnnouncementClick={onAnnouncementClick}
      />
    </div>
  );
};

export default AnnouncementFeedTemplate;
