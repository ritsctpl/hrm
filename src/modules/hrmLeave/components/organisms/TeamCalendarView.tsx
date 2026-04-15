"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Badge, Spin } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { TeamCalendarEntry } from "../../types/api.types";
import { LeaveRequest } from "../../types/domain.types";
import { LEAVE_TYPE_COLORS } from "../../utils/constants";
import styles from "../../styles/HrmLeave.module.css";

interface TeamCalendarViewProps {
  requests?: LeaveRequest[];
}

const TeamCalendarView: React.FC<TeamCalendarViewProps> = () => {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
  const supervisorId = cookies.userId ?? "";

  const now = dayjs();
  const [month, setMonth] = useState<number>(now.month());
  const [year, setYear] = useState<number>(now.year());
  const [entries, setEntries] = useState<TeamCalendarEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadCalendar = async () => {
      if (!site || !supervisorId) return;
      setLoading(true);
      try {
        const data = await HrmLeaveService.getTeamCalendar({
          site,
          managerId: supervisorId,
          month: month + 1,
          year,
        });
        if (!cancelled) setEntries(data);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadCalendar();
    return () => {
      cancelled = true;
    };
  }, [site, supervisorId, month, year]);

  const entriesByDate = useMemo(() => {
    const map: Record<string, TeamCalendarEntry[]> = {};
    entries.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [entries]);

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format("YYYY-MM-DD");
    const dayEntries = entriesByDate[dateStr] ?? [];
    if (dayEntries.length === 0) return null;
    return (
      <ul className={styles.calendarEvents}>
        {dayEntries.slice(0, 2).map((e, idx) => (
          <li key={`${e.employeeId}-${idx}`}>
            <Badge
              color={LEAVE_TYPE_COLORS[e.leaveTypeCode] ?? "#8c8c8c"}
              text={
                <span style={{ fontSize: 10 }}>
                  {e.employeeName.split(" ")[0]}
                </span>
              }
            />
          </li>
        ))}
        {dayEntries.length > 2 && (
          <li>
            <Badge count={`+${dayEntries.length - 2}`} style={{ fontSize: 10 }} />
          </li>
        )}
      </ul>
    );
  };

  return (
    <div className={styles.calendarWrapper}>
      <Spin spinning={loading}>
        <Calendar
          cellRender={dateCellRender}
          onPanelChange={(val, mode) => {
            if (mode === "month") {
              setMonth(val.month());
              setYear(val.year());
            }
          }}
          defaultValue={dayjs().year(year).month(month)}
          mode="month"
        />
      </Spin>
    </div>
  );
};

export default TeamCalendarView;
