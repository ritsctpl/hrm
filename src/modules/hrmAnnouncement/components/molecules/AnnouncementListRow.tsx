"use client";

import React from "react";
import { Row, Col, Typography, Space } from "antd";
import { PushpinOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { AnnouncementListRowProps } from "../../types/ui.types";
import AnnouncementPriorityTag from "../atoms/AnnouncementPriorityTag";
import AnnouncementCategoryBadge from "../atoms/AnnouncementCategoryBadge";
import ReadStatusDot from "../atoms/ReadStatusDot";
import styles from "../../styles/HrmAnnouncement.module.css";

dayjs.extend(relativeTime);

const { Text } = Typography;

const AnnouncementListRow: React.FC<AnnouncementListRowProps> = ({ announcement, onClick }) => (
  <Row
    className={`${styles.listRow} ${!announcement.isRead ? styles.unreadRow : ""}`}
    align="middle"
    gutter={8}
    onClick={() => onClick(announcement)}
  >
    <Col flex="none">
      <ReadStatusDot isRead={announcement.isRead} />
    </Col>
    <Col flex="none">
      {announcement.isPinned && <PushpinOutlined style={{ color: "#faad14" }} />}
    </Col>
    <Col flex="auto">
      <Space direction="vertical" size={2}>
        <Space>
          <AnnouncementPriorityTag priority={announcement.priority} />
          <AnnouncementCategoryBadge category={announcement.category} />
          <Text strong>{announcement.title}</Text>
        </Space>
        {announcement.summary && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {announcement.summary}
          </Text>
        )}
      </Space>
    </Col>
    <Col>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {announcement.publishedAt ? dayjs(announcement.publishedAt).fromNow() : ""}
      </Text>
    </Col>
  </Row>
);

export default AnnouncementListRow;
