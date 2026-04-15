"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Badge, Tooltip } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { parseCookies } from "nookies";
import { LeaveCalendarViewProps } from "../../types/ui.types";
import { LeaveRequest } from "../../types/domain.types";
import { LEAVE_TYPE_COLORS } from "../../utils/constants";
import { HrmHolidayService } from "../../../hrmHoliday/services/hrmHolidayService";
import type { HolidayResponse } from "../../../hrmHoliday/types/api.types";
import styles from "../../styles/HrmLeave.module.css";

const LeaveCalendarView: React.FC<LeaveCalendarViewProps> = ({
  requests,
  year,
  month,
  onMonthChange,
  teamView,
}) => {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
  const buHandle = cookies.buHandle ?? "";

  const [holidays, setHolidays] = useState<HolidayResponse[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadHolidays = async () => {
      if (!site || !buHandle) return;
      try {
        const res = await HrmHolidayService.getPublishedHolidaysForBu({
          site,
          buHandle,
          year,
        });
        if (!cancelled && res?.success) {
          setHolidays(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        if (!cancelled) setHolidays([]);
      }
    };
    loadHolidays();
    return () => {
      cancelled = true;
    };
  }, [site, buHandle, year]);

  const holidaysByDate = useMemo(() => {
    const map: Record<string, HolidayResponse[]> = {};
    holidays.forEach((h) => {
      if (!map[h.date]) map[h.date] = [];
      map[h.date].push(h);
    });
    return map;
  }, [holidays]);

  const getRequestsForDate = (date: Dayjs): LeaveRequest[] => {
    const dateStr = date.format("YYYY-MM-DD");
    return requests.filter((r) => {
      return dateStr >= r.startDate && dateStr <= r.endDate;
    });
  };

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format("YYYY-MM-DD");
    const dayRequests = getRequestsForDate(value);
    const dayHolidays = holidaysByDate[dateStr] ?? [];

    if (dayRequests.length === 0 && dayHolidays.length === 0) return null;

    return (
      <>
        {dayHolidays.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              display: "flex",
              gap: 2,
            }}
          >
            {dayHolidays.slice(0, 2).map((h) => (
              <Tooltip key={h.handle} title={h.name}>
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: h.categoryColorHex || "#f5222d",
                  }}
                />
              </Tooltip>
            ))}
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
