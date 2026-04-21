"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { Calendar, Badge, Spin } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { TeamCalendarEntry } from "../../types/api.types";
import { LeaveRequest } from "../../types/domain.types";
import { LEAVE_TYPE_COLORS } from "../../utils/constants";
import { useHolidayCalendar } from "../../hooks/useHolidayCalendar";
import styles from "../../styles/HrmLeave.module.css";

interface TeamCalendarViewProps {
  requests?: LeaveRequest[];
}

const TeamCalendarView: React.FC<TeamCalendarViewProps> = () => {
  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const supervisorId = cookies.userId ?? "";

  const now = dayjs();
  const [month, setMonth] = useState<number>(now.month());
  const [year, setYear] = useState<number>(now.year());
  const [entries, setEntries] = useState<TeamCalendarEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const { getHolidayName } = useHolidayCalendar(year);

  useEffect(() => {
    let cancelled = false;
    const loadCalendar = async () => {
      if (!organizationId || !supervisorId) return;
      setLoading(true);
      try {
        const data = await HrmLeaveService.getTeamCalendar({ organizationId,
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
  }, [organizationId, supervisorId, month, year]);

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
    const holidayName = getHolidayName(dateStr);
    if (dayEntries.length === 0 && !holidayName) return null;
    return (
      <>
        {holidayName && (
          <div className={styles.holidayLabel} title={holidayName}>
            {holidayName}
          </div>
        )}
        {dayEntries.length > 0 && (
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
        )}
      </>
    );
  };

  const fullCellRender = (value: Dayjs) => {
    const dateStr = value.format("YYYY-MM-DD");
    const holidayName = getHolidayName(dateStr);
    const isCurrentMonth = value.month() === month;

    return (
      <div
        className={`ant-picker-cell-inner ant-picker-calendar-date${
          holidayName && isCurrentMonth ? ` ${styles.calendarCellHolidayBg}` : ""
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
      <Spin spinning={loading}>
        <Calendar
          fullCellRender={fullCellRender}
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
