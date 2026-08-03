"use client";

import React, { useEffect } from "react";
import { Alert, Button, Card, Skeleton, Space, Tag, Typography } from "antd";
import { DownloadOutlined, PushpinOutlined } from "@ant-design/icons";
import { fromNow } from "@/utils/dateUtils";
import type { Announcement } from "../../types/domain.types";
import { useSeen } from "../../hooks/useSeen";
import { useEmployeeNames } from "../../hooks/useEmployeeNames";
import ApprovalStatusLine from "./ApprovalStatusLine";
import { formatFileSize } from "../../utils/announcementHelpers";
import AnnouncementPriorityTag from "../atoms/AnnouncementPriorityTag";
import AnnouncementCategoryBadge from "../atoms/AnnouncementCategoryBadge";
import AcknowledgementBanner from "./AcknowledgementBanner";
import styles from "../../styles/HrmAnnouncement.module.css";

const { Title, Text } = Typography;

interface AnnouncementFeedCardProps {
  /** The delivery row — title, priority and the reader's own read/ack state. */
  announcement: Announcement;
  /** The full record once `/get` has answered; carries the message body. */
  body?: Announcement | null;
  bodyLoading?: boolean;
  /** Fired when the card first scrolls into view, to fetch the body. */
  onNeedBody: (handle: string) => void;
  /** Fired once the card has been on screen long enough to count as read. */
  onRead: (handle: string) => void;
  onAcknowledge: (handle: string) => void;
  acknowledging?: boolean;
}

/**
 * One announcement, printed in full.
 *
 * The feed is the announcement — there is no title to click through to a copy
 * of itself. That costs a fetch per card, because the delivery record the feed
 * is built from keeps a title and a summary but not the message, so each card
 * asks for its own body the first time it scrolls into view. Until it lands the
 * summary stands in, so the card is never empty and never jumps.
 */
const AnnouncementFeedCard: React.FC<AnnouncementFeedCardProps> = ({
  announcement,
  body,
  bodyLoading = false,
  onNeedBody,
  onRead,
  onAcknowledge,
  acknowledging = false,
}) => {
  const { ref, entered, dwelled } = useSeen();
  const { nameOf } = useEmployeeNames();
  const handle = announcement.handle;

  useEffect(() => {
    if (entered && handle) onNeedBody(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entered, handle]);

  useEffect(() => {
    if (dwelled && handle && !announcement.isRead) onRead(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dwelled, handle, announcement.isRead]);

  // The delivery row does not say who wrote it — that arrives with the body.
  // Prefer the author over whoever pressed publish: the reader wants to know
  // whose notice this is, not who operated the button.
  const author = body?.createdBy ?? body?.publishedBy ?? announcement.createdBy;
  const pending = (body?.status ?? announcement.status) === "PENDING_APPROVAL";
  const content = body?.content ?? announcement.content;
  const isHtml = (body?.contentFormat ?? announcement.contentFormat ?? "HTML").toUpperCase() === "HTML";
  const attachments = body?.attachments ?? announcement.attachments ?? [];
  const when = announcement.publishedAt ?? body?.publishedAt;

  return (
    <div ref={ref}>
      <Card
        size="small"
        className={[
          styles.feedCard,
          announcement.pinToTop ? styles.pinned : "",
          !announcement.isRead ? styles.unread : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className={styles.feedCardHeader}>
          <Space size={6} wrap>
            {announcement.pinToTop && <PushpinOutlined style={{ color: "#faad14" }} />}
            <AnnouncementPriorityTag priority={announcement.priority} />
            <AnnouncementCategoryBadge category={announcement.category} />
            {!announcement.isRead && <Tag color="blue">new</Tag>}
          </Space>
          {when && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {fromNow(when)}
            </Text>
          )}
        </div>

        <Title level={5} className={styles.feedCardTitle}>
          {announcement.title}
        </Title>

        {(author || pending) && (
          <div className={styles.feedCardByline}>
            {author && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                From <Text strong style={{ fontSize: 12 }}>{nameOf(author)}</Text>
              </Text>
            )}
            {/* Only an unpublished notice is still with an approver, so this
                normally stays hidden in the feed — it earns its place on an
                author's own item, which is the one case it can appear. */}
            {pending && (
              <ApprovalStatusLine announcement={body ?? announcement} />
            )}
          </div>
        )}

        {announcement.withdrawn && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="This announcement was withdrawn"
            description={announcement.withdrawalReason}
          />
        )}

        {announcement.acknowledgmentRequired && (
          <AcknowledgementBanner
            announcement={announcement}
            acknowledging={acknowledging}
            onAcknowledge={() => onAcknowledge(handle)}
          />
        )}

        {content ? (
          isHtml ? (
            <div
              className={styles.detailContent}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className={`${styles.detailContent} ${styles.plainContent}`}>{content}</div>
          )
        ) : announcement.summary ? (
          // Stands in until the body lands, and stays if it never does (denied,
          // withdrawn, or the fetch failed) — it is the same text, cut short.
          <Text type="secondary">{announcement.summary}</Text>
        ) : bodyLoading ? (
          <Skeleton active paragraph={{ rows: 2 }} title={false} />
        ) : (
          <Text type="secondary">No content</Text>
        )}

        {attachments.length > 0 && (
          <Space direction="vertical" size={2} style={{ marginTop: 12, width: "100%" }}>
            {attachments.map((att) => {
              const size = formatFileSize(att.fileSizeBytes);
              return (
                <Space key={att.id} size={4}>
                  <Button
                    type="link"
                    size="small"
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
        )}

        {announcement.matchReason && (
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 12 }}>
            You received this because: {announcement.matchReason}
          </Text>
        )}
      </Card>
    </div>
  );
};

export default AnnouncementFeedCard;
