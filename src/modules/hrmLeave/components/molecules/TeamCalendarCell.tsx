"use client";

import React from "react";
import { Tooltip } from "antd";
import { TeamCalendarCellProps } from "../../types/ui.types";
import { LEAVE_TYPE_COLORS } from "../../utils/constants";
import styles from "../../styles/HrmLeave.module.css";

const TeamCalendarCell: React.FC<TeamCalendarCellProps> = ({ date, requests, holidayName }) => {
  if ((!requests || requests.length === 0) && !holidayName) return null;

  return (
    <div className={styles.calendarCell}>
      {holidayName && (
        <Tooltip title={holidayName}>
          <div className={styles.holidayLabel}>{holidayName}</div>
        </Tooltip>
      )}
      {requests.slice(0, 3).map((req) => {
        const color = LEAVE_TYPE_COLORS[req.leaveTypeCode] ?? "#8c8c8c";
        const isApproved = req.status === "APPROVED";
        return (
          <Tooltip
            key={req.handle}
            title={`${req.employeeName} — ${req.leaveTypeName} (${req.status})`}
          >
            <div
              className={styles.calendarCellEntry}
              style={{
                background: isApproved ? color : "transparent",
                border: `1px solid ${color}`,
                backgroundImage: isApproved
                  ? undefined
                  : `repeating-linear-gradient(45deg, ${color} 0, ${color} 2px, transparent 0, transparent 50%)`,
                backgroundSize: "6px 6px",
                opacity: 0.85,
              }}
            />
          </Tooltip>
        );
      })}
      {requests.length > 3 && (
        <span className={styles.calendarCellMore}>+{requests.length - 3}</span>
      )}
    </div>
  );
};

export default TeamCalendarCell;
