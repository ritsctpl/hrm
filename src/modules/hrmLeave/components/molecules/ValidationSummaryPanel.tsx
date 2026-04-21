"use client";

import React from "react";
import { Alert, Descriptions, Skeleton, Tag } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import BalanceDeltaDisplay from "../atoms/BalanceDeltaDisplay";
import { ValidationSummaryPanelProps } from "../../types/ui.types";

const STATE_CONFIG: Record<string, { type: "success" | "warning" | "error" | "info"; label: string }> = {
  eligible: { type: "success", label: "Eligible" },
  insufficient_balance: { type: "error", label: "Insufficient Balance" },
  overlap_detected: { type: "warning", label: "Overlap Detected" },
  requires_hr_review: { type: "warning", label: "Requires HR Review" },
  insufficient_notice: { type: "warning", label: "Insufficient Notice" },
  below_minimum: { type: "error", label: "Below Minimum" },
  exceeds_maximum: { type: "error", label: "Exceeds Maximum" },
  probation_restricted: { type: "error", label: "Probation Restricted" },
  gender_restricted: { type: "error", label: "Not Applicable" },
  backdated_requires_hr: { type: "warning", label: "Backdated — HR Review" },
  clubbing_violation: { type: "error", label: "Clubbing Violation" },
  blackout_period: { type: "error", label: "Blackout Period" },
};

const VALIDATION_MESSAGES: Record<string, { icon: React.ReactNode; color: string; message: string }> = {
  insufficient_notice: {
    icon: <ClockCircleOutlined />,
    color: "#faad14",
    message: "This leave type requires advance notice. Please apply earlier.",
  },
  below_minimum: {
    icon: <ExclamationCircleOutlined />,
    color: "#ff4d4f",
    message: "Request is below the minimum days required per application.",
  },
  exceeds_maximum: {
    icon: <ExclamationCircleOutlined />,
    color: "#ff4d4f",
    message: "Request exceeds the maximum consecutive days allowed.",
  },
  probation_restricted: {
    icon: <StopOutlined />,
    color: "#ff4d4f",
    message: "This leave type is not available during your probation period.",
  },
  gender_restricted: {
    icon: <StopOutlined />,
    color: "#ff4d4f",
    message: "This leave type is not applicable for you.",
  },
  backdated_requires_hr: {
    icon: <WarningOutlined />,
    color: "#faad14",
    message: "Backdated request — this will be routed to HR for approval.",
  },
  clubbing_violation: {
    icon: <ExclamationCircleOutlined />,
    color: "#ff4d4f",
    message: "This leave type cannot be taken adjacent to another restricted leave type.",
  },
  blackout_period: {
    icon: <StopOutlined />,
    color: "#ff4d4f",
    message: "Leave applications are not allowed during the current blackout period.",
  },
};

const ValidationSummaryPanel: React.FC<ValidationSummaryPanelProps> = ({
  summary,
  loading,
}) => {
  if (loading) return <Skeleton active paragraph={{ rows: 3 }} />;
  if (!summary) return null;

  const stateConfig = STATE_CONFIG[summary.state] ?? { type: "info", label: summary.state };
  const validationMsg = VALIDATION_MESSAGES[summary.state];

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

      {/* Policy-rule validation message for the current state */}
      {validationMsg && (
        <Alert
          type={stateConfig.type === "error" ? "error" : "warning"}
          message={
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {validationMsg.icon}
              <span>{validationMsg.message}</span>
            </span>
          }
          style={{ marginBottom: 8, fontSize: 12 }}
          banner
        />
      )}

      {/* Sandwich rule info */}
      {summary.sandwichDaysAdded != null && summary.sandwichDaysAdded > 0 && (
        <Alert
          type="info"
          message={`Note: ${summary.sandwichDaysAdded} weekend/holiday day${summary.sandwichDaysAdded > 1 ? "s" : ""} added due to sandwich rule`}
          style={{ marginBottom: 8, fontSize: 12 }}
          banner
        />
      )}

      {/* Server-calculated days (when different from requested) */}
      {summary.calculatedDays != null && summary.calculatedDays !== summary.requestedUnits && (
        <Alert
          type="info"
          message={`Server-calculated: ${summary.calculatedDays} working days`}
          style={{ marginBottom: 8, fontSize: 12 }}
          banner
        />
      )}

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
