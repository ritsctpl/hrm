"use client";

import React from "react";
import { Timeline, Tag, Typography } from "antd";
import type { ExpenseApprovalAction } from "../../types/domain.types";
import dayjs from "dayjs";

const { Text } = Typography;

const ACTION_COLORS: Record<string, string> = {
  SUBMIT: "blue",
  APPROVE: "green",
  REJECT: "red",
  ESCALATE: "orange",
  SANCTION: "cyan",
  PAY: "success",
  CANCEL: "default",
  RECALL: "purple",
};

interface Props {
  actions: ExpenseApprovalAction[];
}

const ExpenseApprovalTimeline: React.FC<Props> = ({ actions }) => {
  if (actions.length === 0) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#8c8c8c" }}>
        No timeline events yet.
      </div>
    );
  }

  return (
    <Timeline
      items={actions.map((a) => {
        const detailParts: string[] = [];
        if (a.sanctionedAmount != null) {
          detailParts.push(
            `Sanctioned INR ${a.sanctionedAmount.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}`,
          );
        }
        if (a.paymentMode) detailParts.push(`Mode: ${a.paymentMode}`);
        if (a.paymentReference) detailParts.push(`Ref: ${a.paymentReference}`);

        return {
          color: ACTION_COLORS[a.action] ?? "blue",
          children: (
            <div>
              <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>
                {dayjs(a.actionAt).format("DD MMM YYYY, hh:mm A")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Tag color={ACTION_COLORS[a.action] ?? "blue"} style={{ margin: 0 }}>
                  {a.action}
                </Tag>
                <Text style={{ fontSize: 13 }}>
                  {a.actorName ?? "—"} ({a.actorRole})
                </Text>
                {a.remarks && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    — {a.remarks}
                  </Text>
                )}
              </div>
              {detailParts.length > 0 && (
                <div style={{ fontSize: 12, color: "#595959", marginTop: 4 }}>
                  {detailParts.join(" · ")}
                </div>
              )}
            </div>
          ),
        };
      })}
    />
  );
};

export default ExpenseApprovalTimeline;
