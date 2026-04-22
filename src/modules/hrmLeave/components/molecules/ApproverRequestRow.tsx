"use client";

import React from "react";
import { Typography, Button, Space } from "antd";
import LeaveTypeTag from "../atoms/LeaveTypeTag";
import LeaveStatusChip from "../atoms/LeaveStatusChip";
import SlaCountdownBadge from "../atoms/SlaCountdownBadge";
import EscalationLevelBadge from "../atoms/EscalationLevelBadge";
import { ApproverRequestRowProps } from "../../types/ui.types";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;

const ApproverRequestRow: React.FC<ApproverRequestRowProps & { resolvedEmployeeName?: string }> = ({
  request,
  isSelected,
  onClick,
  resolvedEmployeeName,
}) => {
  const displayName = request.employeeName || resolvedEmployeeName || request.employeeId || "Unknown";
  const fromDate = new Date(request.startDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
  const toDate = new Date(request.endDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div
      className={`${styles.requestRow} ${isSelected ? styles.requestRowSelected : ""}`}
      onClick={() => onClick(request)}
    >
      <div className={styles.requestRowTop}>
        <Text strong style={{ fontSize: 13 }}>{displayName}</Text>
        <LeaveTypeTag code={request.leaveTypeCode} />
      </div>
      <div className={styles.requestRowMid}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {fromDate} – {toDate} ({request.totalDays.toFixed(1)}d)
        </Text>
      </div>
      <div className={styles.requestRowBottom}>
        {request.slaDeadline && (
          <SlaCountdownBadge
            deadline={request.slaDeadline}
            breached={request.slaBreached}
            escalationLevel={request.escalationLevel}
          />
        )}
        <EscalationLevelBadge level={request.escalationLevel} />
      </div>
    </div>
  );
};

export default ApproverRequestRow;
