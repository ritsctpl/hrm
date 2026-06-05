"use client";

import React from "react";
import { Card, Progress, Tag, Tooltip, Typography } from "antd";
import { LeaveBalanceCardProps } from "../../types/ui.types";
import { getLeaveTypeColor } from "../../utils/constants";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;

const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({
  balance,
  onClick,
  isSelected,
}) => {
  const color = getLeaveTypeColor(balance.leaveTypeCode);
  const total = balance.ytdCredits + balance.openingCarryForward || 1;
  const usedPercent = Math.min(100, Math.round((balance.ytdDebits / total) * 100));
  // Item 4: surface negative-balance usage on the tile. The exact floor +
  // remaining-negative numbers live on the policy; show them in the apply-
  // leave drawer where the policy is loaded. Here just flag the state.
  const usingNegative = balance.availableBalance < 0;

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      className={`${styles.balanceCard} ${isSelected ? styles.balanceCardSelected : ""}`}
      style={{ borderTop: `3px solid ${color}`, cursor: onClick ? "pointer" : "default" }}
      size="small"
    >
      <div className={styles.balanceCardHeader}>
        <span className={styles.balanceCardCode} style={{ color }}>
          {balance.leaveTypeCode}
        </span>
        <span className={styles.balanceCardName}>{balance.leaveTypeName}</span>
      </div>

      <div className={styles.balanceCardMain}>
        <span
          className={styles.balanceCardAvailable}
          style={usingNegative ? { color: "#dc2626" } : undefined}
        >
          {balance.availableBalance.toFixed(1)}
        </span>
        <span className={styles.balanceCardUnit}>days available</span>
        {usingNegative && (
          <Tooltip title="You are using negative leave balance.">
            <Tag color="orange" style={{ marginLeft: 6 }}>Negative</Tag>
          </Tooltip>
        )}
      </div>
      {usingNegative && (
        <Text type="warning" style={{ fontSize: 11, display: "block", marginTop: 2 }}>
          Warning: negative balance in use.
        </Text>
      )}

      <Progress
        percent={usedPercent}
        strokeColor={color}
        trailColor="#f0f0f0"
        showInfo={false}
        size="small"
        style={{ margin: "4px 0" }}
      />

      <div className={styles.balanceCardStats}>
        <Tooltip title="Used Year-to-Date">
          <span>Used: {balance.ytdDebits.toFixed(1)}</span>
        </Tooltip>
        <Tooltip title="Pending Approval">
          <span>Pend: {balance.pendingApproval.toFixed(1)}</span>
        </Tooltip>
        {balance.carryForwardAllowed && (
          <Tooltip title="Carry Forward Allowed">
            <span className={styles.balanceCardBadge} style={{ color: "#52c41a" }}>CF</span>
          </Tooltip>
        )}
        {balance.encashmentAllowed && (
          <Tooltip title="Encashment Allowed">
            <span className={styles.balanceCardBadge} style={{ color: "#fa8c16" }}>En</span>
          </Tooltip>
        )}
      </div>
    </Card>
  );
};

export default LeaveBalanceCard;
