"use client";

import React from "react";
import { Timeline, Tag, Typography } from "antd";
import { ActionHistoryTimelineProps } from "../../types/ui.types";

const { Text } = Typography;

const ACTION_COLORS: Record<string, string> = {
  SUBMIT: "blue",
  APPROVE: "green",
  REJECT: "red",
  ESCALATE: "volcano",
  CANCEL: "default",
  REASSIGN: "purple",
  OVERRIDE: "gold",
};

const ActionHistoryTimeline: React.FC<ActionHistoryTimelineProps> = ({ actions }) => {
  if (!actions || actions.length === 0) {
    return <Text type="secondary">No action history available.</Text>;
  }

  return (
    <Timeline
      items={actions.map((action) => ({
        color: ACTION_COLORS[action.action] ?? "blue",
        children: (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Tag color={ACTION_COLORS[action.action] ?? "blue"} style={{ fontSize: 11 }}>
                {action.action}
              </Tag>
              <Text strong style={{ fontSize: 12 }}>{action.actorName}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>({action.actorRole})</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
              {new Date(action.actionDateTime).toLocaleString("en-GB")}
            </Text>
            {action.remarks && (
              <Text style={{ fontSize: 12, fontStyle: "italic" }}>"{action.remarks}"</Text>
            )}
          </div>
        ),
      }))}
    />
  );
};

export default ActionHistoryTimeline;
