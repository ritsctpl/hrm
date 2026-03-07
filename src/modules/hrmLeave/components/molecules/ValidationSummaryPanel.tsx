"use client";

import React from "react";
import { Alert, Descriptions, Skeleton, Tag } from "antd";
import { CheckCircleOutlined, WarningOutlined } from "@ant-design/icons";
import BalanceDeltaDisplay from "../atoms/BalanceDeltaDisplay";
import { ValidationSummaryPanelProps } from "../../types/ui.types";

const STATE_CONFIG: Record<string, { type: "success" | "warning" | "error" | "info"; label: string }> = {
  eligible: { type: "success", label: "Eligible" },
  insufficient_balance: { type: "error", label: "Insufficient Balance" },
  overlap_detected: { type: "warning", label: "Overlap Detected" },
  requires_hr_review: { type: "warning", label: "Requires HR Review" },
};

const ValidationSummaryPanel: React.FC<ValidationSummaryPanelProps> = ({
  summary,
  loading,
}) => {
  if (loading) return <Skeleton active paragraph={{ rows: 3 }} />;
  if (!summary) return null;

  const stateConfig = STATE_CONFIG[summary.state] ?? { type: "info", label: summary.state };

  return (
    <div style={{ marginTop: 12 }}>
      <Alert
        type={stateConfig.type}
        message={stateConfig.label}
        icon={
          stateConfig.type === "success" ? (
            <CheckCircleOutlined />
          ) : (
            <WarningOutlined />
          )
        }
        showIcon
        style={{ marginBottom: 8 }}
      />

      <Descriptions size="small" column={2} bordered>
        <Descriptions.Item label="Leave Type">{summary.leaveTypeCode}</Descriptions.Item>
        <Descriptions.Item label="Requested">
          {summary.requestedUnits.toFixed(1)} days
        </Descriptions.Item>
        <Descriptions.Item label="Balance" span={2}>
          <BalanceDeltaDisplay before={summary.balanceBefore} after={summary.balanceAfter} />
        </Descriptions.Item>
        {summary.conflictFlags.length > 0 && (
          <Descriptions.Item label="Conflicts" span={2}>
            {summary.conflictFlags.map((flag) => (
              <Tag key={flag} color="warning" style={{ fontSize: 11 }}>
                {flag}
              </Tag>
            ))}
          </Descriptions.Item>
        )}
        {summary.overlaps.length > 0 && (
          <Descriptions.Item label="Overlaps" span={2}>
            {summary.overlaps.map((o) => (
              <Tag key={o.requestId} color="orange" style={{ fontSize: 11 }}>
                {o.startDate} – {o.endDate}
              </Tag>
            ))}
          </Descriptions.Item>
        )}
      </Descriptions>

      {summary.messages.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {summary.messages.map((msg, i) => (
            <p key={i} style={{ fontSize: 12, color: "#595959", margin: "2px 0" }}>
              {msg}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default ValidationSummaryPanel;
