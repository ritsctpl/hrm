"use client";

import React from "react";
import { Drawer, Typography, Space, Divider, Button, Tag } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { AnnouncementDetailPanelProps } from "../../types/ui.types";
import AnnouncementPriorityTag from "../atoms/AnnouncementPriorityTag";
import AnnouncementCategoryBadge from "../atoms/AnnouncementCategoryBadge";
import styles from "../../styles/HrmAnnouncement.module.css";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const AnnouncementDetailPanel: React.FC<AnnouncementDetailPanelProps> = ({
  announcement,
  onClose,
  onMarkRead,
}) => (
  <Drawer
    title="Announcement"
    open
    onClose={onClose}
    width={520}
    extra={
      !announcement.isRead && onMarkRead ? (
        <Button size="small" onClick={() => onMarkRead(announcement.handle)}>
          Mark as Read
        </Button>
      ) : null
    }
  >
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      <Space wrap>
        <AnnouncementPriorityTag priority={announcement.priority} />
        <AnnouncementCategoryBadge category={announcement.category} />
        {announcement.pinToTop && <Tag color="gold">Pinned</Tag>}
      </Space>
      <Title level={4} style={{ margin: 0 }}>
        {announcement.title}
      </Title>
      <Space split={<Divider type="vertical" />}>
        <Text type="secondary">
          {announcement.publishedAt ? dayjs(announcement.publishedAt).fromNow() : ""}
        </Text>
        {announcement.announcementId && (
          <Text type="secondary">{announcement.announcementId}</Text>
        )}
      </Space>
      <Divider style={{ margin: "8px 0" }} />
      <div
        className={styles.detailContent}
        dangerouslySetInnerHTML={{ __html: announcement.content }}
      />
      {announcement.attachments && announcement.attachments.length > 0 && (
        <>
          <Divider />
          <Text strong>Attachments</Text>
          <Space direction="vertical" size={4}>
            {announcement.attachments.map((att) => (
              <Button
                key={att.id}
                type="link"
                icon={<DownloadOutlined />}
                href={att.fileUrl}
                target="_blank"
                style={{ padding: 0 }}
              >
                {att.fileName}
              </Button>
            ))}
          </Space>
        </>
      )}
    </Space>
  </Drawer>
);

export default AnnouncementDetailPanel;
