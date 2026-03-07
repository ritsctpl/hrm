"use client";

import React from "react";
import { Row, Col, Typography, Button, Space, Tooltip } from "antd";
import { useRouter } from "next/navigation";
import { NotificationItemProps } from "../../types/ui.types";
import { getDeepLink, getRelativeTime } from "../../utils/notificationHelpers";
import NotificationTypeBadge from "../atoms/NotificationTypeBadge";
import ReadIndicator from "../atoms/ReadIndicator";
import styles from "../../styles/NotificationCentre.module.css";

const { Text } = Typography;

const NotificationRow: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
  compact = false,
}) => {
  const router = useRouter();
  const deepLink = getDeepLink(notification);

  const handleDeepLink = () => {
    if (deepLink) {
      onMarkRead(notification.id);
      router.push(deepLink);
    }
  };

  return (
    <div className={`${styles.notificationRow} ${!notification.read ? styles.unread : ""}`}>
      <Row align="top" gutter={12} wrap={false}>
        <Col flex="none" style={{ paddingTop: 4 }}>
          <ReadIndicator isRead={notification.read} />
        </Col>
        <Col flex="none">
          <NotificationTypeBadge type={notification.type} size={compact ? 28 : 36} />
        </Col>
        <Col flex="auto" style={{ minWidth: 0 }}>
          <Text strong style={{ display: "block", fontSize: compact ? 13 : 14 }}>
            {notification.title}
          </Text>
          <Text
            type="secondary"
            style={{ fontSize: compact ? 12 : 13, display: "block" }}
            ellipsis={compact}
          >
            {notification.message}
          </Text>
          {!compact && deepLink && (
            <Button
              type="link"
              size="small"
              onClick={handleDeepLink}
              style={{ padding: 0, height: "auto", marginTop: 4 }}
            >
              View &rarr;
            </Button>
          )}
        </Col>
        <Col flex="none" style={{ textAlign: "right" }}>
          <Text type="secondary" style={{ fontSize: 11, whiteSpace: "nowrap" }}>
            {getRelativeTime(notification.createdAt)}
          </Text>
          {!notification.read && (
            <div>
              <Button
                type="link"
                size="small"
                onClick={() => onMarkRead(notification.id)}
                style={{ padding: 0, fontSize: 11 }}
              >
                Mark read
              </Button>
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default NotificationRow;
