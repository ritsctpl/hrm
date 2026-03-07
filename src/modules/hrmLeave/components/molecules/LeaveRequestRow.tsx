"use client";

import React from "react";
import { Typography } from "antd";
import LeaveTypeTag from "../atoms/LeaveTypeTag";
import LeaveStatusChip from "../atoms/LeaveStatusChip";
import HalfDayIndicator from "../atoms/HalfDayIndicator";
import { LeaveRequestRowProps } from "../../types/ui.types";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;

const LeaveRequestRow: React.FC<LeaveRequestRowProps> = ({
  request,
  isSelected,
  onClick,
}) => {
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
        <LeaveTypeTag code={request.leaveTypeCode} name={request.leaveTypeName} />
        <LeaveStatusChip status={request.status} />
      </div>
      <div className={styles.requestRowMid}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {fromDate} – {toDate}
        </Text>
        <HalfDayIndicator dayType={request.startDayType} />
      </div>
      <div className={styles.requestRowBottom}>
        <Text style={{ fontSize: 12 }}>{request.totalDays.toFixed(1)} days</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {new Date(request.createdDateTime).toLocaleDateString("en-GB")}
        </Text>
      </div>
    </div>
  );
};

export default LeaveRequestRow;
