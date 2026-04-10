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
  const unreadCount = [...feed, ...pinnedAnnouncements].filter(
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
            <Option value="LOW">Low</Option>
            <Option value="MEDIUM">Medium</Option>
            <Option value="HIGH">High</Option>
            <Option value="URGENT">Urgent</Option>
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
        pinnedAnnouncements={pinnedAnnouncements}
        feed={feed}
        loading={loading}
        onAnnouncementClick={onAnnouncementClick}
      />
    </div>
  );
};

export default AnnouncementFeedTemplate;
