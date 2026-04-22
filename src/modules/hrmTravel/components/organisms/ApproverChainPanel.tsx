"use client";

import React from "react";
import { Steps, Tag, Typography } from "antd";
import dayjs from "dayjs";
import type { ApproverChainEntry } from "../../types/domain.types";

const { Text } = Typography;

interface Props {
  chain?: ApproverChainEntry[];
  currentApproverId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
  ESCALATED: "volcano",
  SKIPPED: "default",
};

const ApproverChainPanel: React.FC<Props> = ({ chain, currentApproverId }) => {
  if (!chain || chain.length === 0) {
    return (
      <div style={{ padding: "12px 0", color: "#8c8c8c", fontSize: 13 }}>
        Approver chain not available.
      </div>
    );
  }

  const sorted = [...chain].sort((a, b) => a.level - b.level);
  const currentIndex = sorted.findIndex((e) => e.approverId === currentApproverId);

  return (
    <div style={{ padding: "12px 0" }}>
      <Steps
        direction="vertical"
        size="small"
        current={currentIndex >= 0 ? currentIndex : sorted.length}
        items={sorted.map((entry) => ({
          title: (
            <span>
              <Text strong style={{ fontSize: 13 }}>
                {entry.approverName ?? entry.approverId}
              </Text>
              {entry.approverRole && (
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                  ({entry.approverRole})
                </Text>
              )}
            </span>
          ),
          description: (
            <div style={{ fontSize: 12 }}>
              <span>Level {entry.level}</span>
              {entry.status && (
                <Tag
                  color={STATUS_COLORS[entry.status] ?? "default"}
                  style={{ marginLeft: 8 }}
                >
                  {entry.status}
                </Tag>
              )}
              {entry.actionAt && (
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {dayjs(entry.actionAt).format("DD MMM YYYY, hh:mm A")}
                </Text>
              )}
            </div>
          ),
        }))}
      />
    </div>
  );
};

export default ApproverChainPanel;
