'use client';

import React from "react";
import { Button, Card, Tag, Typography } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import type { FeedbackEntry } from "../../types/domain.types";

const FEEDBACK_COLORS: Record<string, string> = {
  PRAISE: "green",
  CONSTRUCTIVE: "orange",
  SUGGESTION: "blue",
  CHECK_IN: "cyan",
};

interface Props {
  entry: FeedbackEntry;
  onAcknowledge?: (feedbackId: string) => void;
}

const FeedbackItemCard: React.FC<Props> = ({ entry, onAcknowledge }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: "10px 0",
      borderBottom: "1px solid #f0f0f0",
    }}
  >
    <div style={{ flex: 1 }}>
      <Tag color={FEEDBACK_COLORS[entry.feedbackType] ?? "default"}>{entry.feedbackType}</Tag>
      <Typography.Text strong style={{ marginLeft: 8 }}>
        {entry.fromEmployeeName}
      </Typography.Text>
      <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 11 }}>
        {entry.createdDateTime}
      </Typography.Text>
      <div style={{ marginTop: 4, fontSize: 13 }}>{entry.content}</div>
    </div>
    {!entry.acknowledged && onAcknowledge && (
      <Button
        size="small"
        icon={<CheckOutlined />}
        onClick={() => onAcknowledge(entry.feedbackId)}
        style={{ marginLeft: 12 }}
      >
        Ack
      </Button>
    )}
  </div>
);

export default FeedbackItemCard;
