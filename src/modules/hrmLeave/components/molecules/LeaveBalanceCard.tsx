"use client";

import React from "react";
import { Card, Progress, Tooltip } from "antd";
import { LeaveBalanceCardProps } from "../../types/ui.types";
import { LEAVE_TYPE_COLORS } from "../../utils/constants";
import styles from "../../styles/HrmLeave.module.css";

const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({
  balance,
  onClick,
  isSelected,
}) => {
  const color = LEAVE_TYPE_COLORS[balance.leaveTypeCode] ?? "#8c8c8c";
  const total = balance.ytdCredits + balance.openingCarryForward || 1;
  const usedPercent = Math.min(100, Math.round((balance.ytdDebits / total) * 100));

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
        <span className={styles.balanceCardAvailable}>{balance.availableBalance.toFixed(1)}</span>
        <span className={styles.balanceCardUnit}>days available</span>
      </div>

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
