"use client";

import React from "react";
import { Alert, Button, Space, Typography, Tag } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { formatDateTime, parseDateOnly } from "@/utils/dateUtils";
import type { Announcement } from "../../types/domain.types";

const { Text } = Typography;

interface AcknowledgementBannerProps {
  announcement: Announcement;
  acknowledging: boolean;
  onAcknowledge: () => void;
}

/**
 * Acknowledgement prompt for the reader.
 *
 * Reading is passive; acknowledging is the employee confirming they have
 * understood, and it is what `acknowledgedCount` and the overdue tracking
 * count. Without this control the loop is broken — the server can demand an
 * acknowledgement and report on it, but nobody can give one.
 *
 * Per-employee state only comes from the feed endpoints, so this renders
 * nothing when the record came from `/get` alone.
 */
const AcknowledgementBanner: React.FC<AcknowledgementBannerProps> = ({
  announcement,
  acknowledging,
  onAcknowledge,
}) => {
  if (!announcement.acknowledgmentRequired) return null;

  const due = announcement.acknowledgmentDueDate;
  const overdue = !!announcement.acknowledgmentOverdue;

  if (announcement.isAcknowledged) {
    return (
      <Alert
        type="success"
        showIcon
        icon={<CheckCircleOutlined />}
        style={{ marginBottom: 12 }}
        message="You have acknowledged this announcement"
        description={
          announcement.acknowledgedAt
            ? `On ${formatDateTime(announcement.acknowledgedAt)}`
            : undefined
        }
      />
    );
  }

  return (
    <Alert
      type={overdue ? "error" : "warning"}
      showIcon
      style={{ marginBottom: 12 }}
      message={
        <Space size={8}>
          <span>Acknowledgement required</span>
          {overdue && <Tag color="red">overdue</Tag>}
        </Space>
      }
      description={
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Text style={{ fontSize: 13 }}>
            Confirm you have read and understood this announcement.
            {due && (
              <>
                {" "}
                {overdue ? "It was due " : "Due by "}
                <Text strong>{parseDateOnly(due)?.format("DD-MMM-YYYY")}</Text>.
              </>
            )}
          </Text>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            loading={acknowledging}
            onClick={onAcknowledge}
          >
            I acknowledge
          </Button>
        </Space>
      }
    />
  );
};

export default AcknowledgementBanner;
