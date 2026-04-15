"use client";

import React from "react";
import { Timeline, Tag, Typography } from "antd";
import type { TravelAction } from "../../types/domain.types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const { Text } = Typography;

const ACTION_COLORS: Record<string, string> = {
  SUBMIT: "blue",
  APPROVE: "green",
  REJECT: "red",
  ESCALATE: "orange",
  CANCEL: "default",
  RECALL: "purple",
};

interface Props {
  actions: TravelAction[];
}

const ApprovalTimeline: React.FC<Props> = ({ actions }) => {
  if (actions.length === 0) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#8c8c8c" }}>
        No timeline events yet.
      </div>
    );
  }

  return (
    <Timeline
      items={actions.map((a) => ({
        color: ACTION_COLORS[a.action] ?? "blue",
        children: (
          <div>
            <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>
              {a.actionDateTime
                ? dayjs.utc(a.actionDateTime).local().format("DD MMM YYYY, hh:mm A")
                : "—"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Tag color={ACTION_COLORS[a.action] ?? "blue"} style={{ margin: 0 }}>
                {a.action}
              </Tag>
              <Text style={{ fontSize: 13 }}>
                {a.actorName} ({a.actorRole})
              </Text>
              {a.remarks && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  — {a.remarks}
                </Text>
              )}
            </div>
          </div>
        ),
      }))}
    />
  );
};

export default ApprovalTimeline;
