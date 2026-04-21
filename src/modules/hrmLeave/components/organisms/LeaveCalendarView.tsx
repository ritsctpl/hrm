"use client";

import React from "react";
import { Calendar, Badge } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { LeaveCalendarViewProps } from "../../types/ui.types";
import { LeaveRequest } from "../../types/domain.types";
import { LEAVE_TYPE_COLORS } from "../../utils/constants";
import { useHolidayCalendar } from "../../hooks/useHolidayCalendar";
import styles from "../../styles/HrmLeave.module.css";

const LeaveCalendarView: React.FC<LeaveCalendarViewProps> = ({
  requests,
  year,
  month,
  onMonthChange,
  teamView,
}) => {
  const { isHoliday, getHolidayName } = useHolidayCalendar(year);

  const getRequestsForDate = (date: Dayjs): LeaveRequest[] => {
    const dateStr = date.format("YYYY-MM-DD");
    return requests.filter((r) => {
      return dateStr >= r.startDate && dateStr <= r.endDate;
    });
  };

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format("YYYY-MM-DD");
    const dayRequests = getRequestsForDate(value);
    const holidayName = getHolidayName(dateStr);

    if (dayRequests.length === 0 && !holidayName) return null;

    return (
      <>
        {holidayName && (
          <div className={styles.holidayLabel} title={holidayName}>
            {holidayName}
          </div>
        )}
        {dayRequests.length > 0 && (
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
        )}
      </>
    );
  };

  const fullCellRender = (value: Dayjs) => {
    const dateStr = value.format("YYYY-MM-DD");
    const holidayOnDate = isHoliday(dateStr);
    const isCurrentMonth = value.month() === month;

    return (
      <div
        className={`ant-picker-cell-inner ant-picker-calendar-date${
          holidayOnDate && isCurrentMonth ? ` ${styles.calendarCellHolidayBg}` : ""
        }`}
      >
        <div className="ant-picker-calendar-date-value">{value.date()}</div>
        <div className="ant-picker-calendar-date-content">
          {dateCellRender(value)}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.calendarWrapper}>
      <div className={styles.calendarLegend}>
        <span className={styles.calendarLegendItem}>
          <span className={styles.calendarLegendHolidayDot} />
          Holiday
        </span>
      </div>
      <Calendar
        fullCellRender={fullCellRender}
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
