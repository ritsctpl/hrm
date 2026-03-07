"use client";

import React from "react";
import { Calendar, Badge } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { LeaveCalendarViewProps } from "../../types/ui.types";
import { LeaveRequest } from "../../types/domain.types";
import { LEAVE_TYPE_COLORS, LEAVE_STATUS_COLORS } from "../../utils/constants";
import styles from "../../styles/HrmLeave.module.css";

const LeaveCalendarView: React.FC<LeaveCalendarViewProps> = ({
  requests,
  year,
  month,
  onMonthChange,
  teamView,
}) => {
  const getRequestsForDate = (date: Dayjs): LeaveRequest[] => {
    const dateStr = date.format("YYYY-MM-DD");
    return requests.filter((r) => {
      return dateStr >= r.startDate && dateStr <= r.endDate;
    });
  };

  const dateCellRender = (value: Dayjs) => {
    const dayRequests = getRequestsForDate(value);
    if (dayRequests.length === 0) return null;

    return (
      <ul className={styles.calendarEvents}>
        {dayRequests.slice(0, 2).map((req) => (
          <li key={req.handle}>
            <Badge
              color={LEAVE_TYPE_COLORS[req.leaveTypeCode] ?? "#8c8c8c"}
              text={
                <span style={{ fontSize: 10 }}>
                  {teamView ? req.employeeName.split(" ")[0] : req.leaveTypeName}
                </span>
              }
            />
          </li>
        ))}
        {dayRequests.length > 2 && (
          <li>
            <Badge count={`+${dayRequests.length - 2}`} style={{ fontSize: 10 }} />
          </li>
        )}
      </ul>
    );
  };

  return (
    <div className={styles.calendarWrapper}>
      <Calendar
        cellRender={dateCellRender}
        onPanelChange={(val, mode) => {
          if (mode === "month") onMonthChange(val.month());
        }}
        defaultValue={dayjs().year(year).month(month)}
        mode="month"
      />
    </div>
  );
};

export default LeaveCalendarView;
