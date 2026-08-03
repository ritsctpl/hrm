"use client";

import React from "react";
import { Drawer, Typography, Space, Divider, Button, Tag } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { fromNow } from "@/utils/dateUtils";
import { AnnouncementDetailPanelProps } from "../../types/ui.types";
import AnnouncementPriorityTag from "../atoms/AnnouncementPriorityTag";
import AnnouncementCategoryBadge from "../atoms/AnnouncementCategoryBadge";
import { formatFileSize } from "../../utils/announcementHelpers";
import ApprovalStatusLine, { approverOf } from "../molecules/ApprovalStatusLine";
import RatificationBanner from "../molecules/RatificationBanner";
import AcknowledgementBanner from "../molecules/AcknowledgementBanner";
import styles from "../../styles/HrmAnnouncement.module.css";

const { Title, Text } = Typography;

const AnnouncementDetailPanel: React.FC<AnnouncementDetailPanelProps> = ({
  announcement,
  onClose,
  onMarkRead,
  canRatify = false,
  onRatify,
  onRefuseRatification,
  acknowledging = false,
  onAcknowledge,
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
      {onAcknowledge && (
        <AcknowledgementBanner
          announcement={announcement}
          acknowledging={acknowledging}
          onAcknowledge={onAcknowledge}
        />
      )}
      {announcement.ratificationStatus && (
        <RatificationBanner
          announcement={announcement}
          canRatify={canRatify}
          onRatify={() => onRatify?.()}
          onRefuse={() => onRefuseRatification?.()}
        />
      )}
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
          {fromNow(announcement.publishedAt)}
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
            {announcement.attachments.map((att) => {
              const size = formatFileSize(att.fileSizeBytes);
              return (
                <Space key={att.id} size={4}>
                  <Button
                    type="link"
                    icon={<DownloadOutlined />}
                    href={att.fileUrl}
                    target="_blank"
                    style={{ padding: 0 }}
                  >
                    {att.fileName}
                  </Button>
                  {size && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ({size})
                    </Text>
                  )}
                </Space>
              );
            })}
          </Space>
        </>
      )}
      {/* One approver at a time — where it is now, or who decided it. */}
      {(announcement.status === "PENDING_APPROVAL" ||
        approverOf(announcement) ||
        announcement.approvedBy ||
        announcement.rejectedBy) && (
        <>
          <Divider style={{ margin: "8px 0" }} />
          <Text strong>Approval</Text>
          <ApprovalStatusLine announcement={announcement} variant="detail" />
        </>
      )}
    </Space>
  </Drawer>
);

export default AnnouncementDetailPanel;
