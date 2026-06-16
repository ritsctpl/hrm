"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { Calendar, Badge, Spin, Segmented, Tooltip, Tag } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { TeamCalendarEntry } from "../../types/api.types";
import { LeaveRequest } from "../../types/domain.types";
import { LEAVE_TYPE_COLORS, getLeaveTypeColor } from "../../utils/constants";
import { useHolidayCalendar } from "../../hooks/useHolidayCalendar";
import { useEmployeeIdentity } from "../../../hrmAccess/hooks/useEmployeeIdentity";
import styles from "../../styles/HrmLeave.module.css";

dayjs.extend(isoWeek);

// ── Types ─────────────────────────────────────────────────────────────

type ViewMode = "Month" | "Week";

interface TeamCalendarViewProps {
  requests?: LeaveRequest[];
}

// ── Legend ────────────────────────────────────────────────────────────

const LEGEND_ITEMS = Object.entries(LEAVE_TYPE_COLORS).map(([code, color]) => ({
  code,
  color,
}));

const CalendarLegend: React.FC = () => (
  <div className={styles.calendarLegend}>
    <span className={styles.calendarLegendItem}>
      <span
        style={{
          display: "inline-block",
          width: 10,
          height: 10,
          borderRadius: 2,
          background: "#cf1322",
          flexShrink: 0,
        }}
      />
      Holiday
    </span>
    {LEGEND_ITEMS.map(({ code, color }) => (
      <span key={code} className={styles.calendarLegendItem}>
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: 2,
            background: color,
            flexShrink: 0,
          }}
        />
        {code}
      </span>
    ))}
  </div>
);

// ── Tooltip content for a single entry ───────────────────────────────

const EntryTooltip: React.FC<{ entry: TeamCalendarEntry }> = ({ entry }) => (
  <div style={{ fontSize: 12, lineHeight: 1.6 }}>
    <div style={{ fontWeight: 600, marginBottom: 2 }}>{entry.employeeName}</div>
    <div>
      <span style={{ color: "#ccc" }}>Type: </span>
      {entry.leaveTypeName} ({entry.leaveTypeCode})
    </div>
    <div>
      <span style={{ color: "#ccc" }}>Date: </span>
      {dayjs(entry.date).format("DD MMM YYYY")}
    </div>
    <div>
      <span style={{ color: "#ccc" }}>Day: </span>
      {entry.dayType === "FIRST_HALF"
        ? "First Half (AM)"
        : entry.dayType === "SECOND_HALF"
        ? "Second Half (PM)"
        : "Full Day"}
    </div>
    <div>
      <span style={{ color: "#ccc" }}>Status: </span>
      {entry.status.replace(/_/g, " ")}
    </div>
  </div>
);

// ── Monthly View ─────────────────────────────────────────────────────

interface MonthlyViewProps {
  month: number;
  year: number;
  entriesByDate: Record<string, TeamCalendarEntry[]>;
  getHolidayName: (dateStr: string) => string | undefined;
  onPanelChange: (val: Dayjs, mode: string) => void;
}

const MonthlyView: React.FC<MonthlyViewProps> = ({
  month,
  year,
  entriesByDate,
  getHolidayName,
  onPanelChange,
}) => {
  const dateCellContent = (value: Dayjs) => {
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
                <Tooltip
                  title={<EntryTooltip entry={e} />}
                  placement="top"
                  overlayStyle={{ maxWidth: 220 }}
                >
                  <span style={{ cursor: "default" }}>
                    <Badge
                      color={getLeaveTypeColor(e.leaveTypeCode)}
                      text={
                        <span style={{ fontSize: 10 }}>
                          {(e.employeeName || e.employeeId || "—").split(" ")[0]}
                        </span>
                      }
                    />
                  </span>
                </Tooltip>
              </li>
            ))}
            {dayEntries.length > 2 && (
              <li>
                <Tooltip
                  placement="top"
                  title={
                    <div style={{ fontSize: 12 }}>
                      {dayEntries.slice(2).map((e, idx) => (
                        <div key={`${e.employeeId}-overflow-${idx}`}>
                          {e.employeeName || e.employeeId || "—"} —{" "}
                          {e.leaveTypeName}
                        </div>
                      ))}
                    </div>
                  }
                >
                  <Badge
                    count={`+${dayEntries.length - 2}`}
                    style={{ fontSize: 10, cursor: "pointer" }}
                  />
                </Tooltip>
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
          {dateCellContent(value)}
        </div>
      </div>
    );
  };

  return (
    <Calendar
      fullCellRender={fullCellRender}
      onPanelChange={(val, mode) => {
        if (mode === "month") onPanelChange(val, mode);
      }}
      defaultValue={dayjs().year(year).month(month)}
      mode="month"
    />
  );
};

// ── Weekly View ───────────────────────────────────────────────────────

interface WeeklyViewProps {
  weekStart: Dayjs;
  entriesByDate: Record<string, TeamCalendarEntry[]>;
  getHolidayName: (dateStr: string) => string | undefined;
}

const WeeklyView: React.FC<WeeklyViewProps> = ({
  weekStart,
  entriesByDate,
  getHolidayName,
}) => {
  // Build the 7 days of the week
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day"));

  // Collect all unique employees visible this week
  const employeesOnLeaveThisWeek = useMemo(() => {
    const employeeMap: Record<string, string> = {};
    days.forEach((day) => {
      const dateStr = day.format("YYYY-MM-DD");
      const dayEntries = entriesByDate[dateStr] ?? [];
      dayEntries.forEach((e) => {
        if (!e.employeeId) return;
        employeeMap[e.employeeId] = e.employeeName || e.employeeId;
      });
    });
    // Sort alphabetically by name
    return Object.entries(employeeMap).sort((a, b) => a[1].localeCompare(b[1]));
  }, [days, entriesByDate]);

  const today = dayjs().format("YYYY-MM-DD");
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const colWidth = `${100 / 8}%`; // 1 col for names + 7 for days

  const headerCellStyle = (dateStr: string): React.CSSProperties => {
    const isToday = dateStr === today;
    const holidayName = getHolidayName(dateStr);
    return {
      padding: "6px 4px",
      textAlign: "center",
      fontWeight: 600,
      fontSize: 12,
      background: isToday ? "#e6f4ff" : holidayName ? "#fff1f0" : "#fafafa",
      borderBottom: "1px solid #e8eef5",
      borderRight: "1px solid #e8eef5",
      color: isToday ? "#1890ff" : holidayName ? "#cf1322" : "#0f172a",
      width: colWidth,
    };
  };

  const nameCellStyle: React.CSSProperties = {
    padding: "8px 10px",
    fontWeight: 600,
    fontSize: 12,
    color: "#0f172a",
    background: "#fafafa",
    borderRight: "1px solid #e8eef5",
    borderBottom: "1px solid #f0f0f0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 140,
    width: colWidth,
  };

  const dataCellStyle = (
    dateStr: string,
    hasEntry: boolean
  ): React.CSSProperties => {
    const isToday = dateStr === today;
    const holidayName = getHolidayName(dateStr);
    return {
      padding: "6px 4px",
      borderRight: "1px solid #f0f0f0",
      borderBottom: "1px solid #f0f0f0",
      background: isToday
        ? "#f0f7ff"
        : holidayName
        ? "#fff7f6"
        : hasEntry
        ? "#fafcff"
        : "#ffffff",
      verticalAlign: "middle",
      textAlign: "center",
      width: colWidth,
    };
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #e8eef5",
          borderRadius: 8,
          overflow: "hidden",
          tableLayout: "fixed",
        }}
      >
        <thead>
          <tr>
            {/* Corner: employee name column header */}
            <th
              style={{
                ...headerCellStyle(""),
                background: "#f0f5ff",
                color: "#1d39c4",
                textAlign: "left",
                paddingLeft: 10,
              }}
            >
              Team Member
            </th>
            {days.map((day) => {
              const dateStr = day.format("YYYY-MM-DD");
              const holidayName = getHolidayName(dateStr);
              const isToday = dateStr === today;
              return (
                <th key={dateStr} style={headerCellStyle(dateStr)}>
                  <div>{DAY_LABELS[day.day()]}</div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: isToday ? 700 : 500,
                      lineHeight: 1.2,
                    }}
                  >
                    {day.date()}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>
                    {day.format("MMM")}
                  </div>
                  {holidayName && (
                    <Tooltip title={holidayName} placement="bottom">
                      <div
                        style={{
                          fontSize: 9,
                          color: "#cf1322",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 70,
                          margin: "2px auto 0",
                        }}
                      >
                        {holidayName}
                      </div>
                    </Tooltip>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {employeesOnLeaveThisWeek.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                style={{
                  textAlign: "center",
                  padding: "40px 16px",
                  color: "#94a3b8",
                  fontSize: 13,
                }}
              >
                No team members on leave this week.
              </td>
            </tr>
          ) : (
            employeesOnLeaveThisWeek.map(([empId, empName]) => (
              <tr key={empId}>
                <td style={nameCellStyle}>
                  <Tooltip title={empName} placement="right">
                    <span>{empName}</span>
                  </Tooltip>
                </td>
                {days.map((day) => {
                  const dateStr = day.format("YYYY-MM-DD");
                  const dayEntries = (entriesByDate[dateStr] ?? []).filter(
                    (e) => e.employeeId === empId
                  );
                  const hasEntry = dayEntries.length > 0;

                  return (
                    <td key={dateStr} style={dataCellStyle(dateStr, hasEntry)}>
                      {dayEntries.map((e, idx) => (
                        <Tooltip
                          key={`${e.employeeId}-${dateStr}-${idx}`}
                          title={<EntryTooltip entry={e} />}
                          placement="top"
                          overlayStyle={{ maxWidth: 220 }}
                        >
                          <div
                            style={{
                              background: getLeaveTypeColor(e.leaveTypeCode),
                              color: "#fff",
                              borderRadius: 4,
                              padding: "3px 6px",
                              fontSize: 10,
                              fontWeight: 600,
                              cursor: "default",
                              display: "inline-block",
                              marginBottom: idx < dayEntries.length - 1 ? 2 : 0,
                              boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                            }}
                          >
                            {e.leaveTypeCode}
                            {e.dayType && e.dayType !== "FULL" && (
                              <span style={{ opacity: 0.85, marginLeft: 2 }}>
                                {e.dayType === "FIRST_HALF" ? "AM" : "PM"}
                              </span>
                            )}
                          </div>
                        </Tooltip>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────

const TeamCalendarView: React.FC<TeamCalendarViewProps> = () => {
  const cookies = parseCookies();
  const identity = useEmployeeIdentity();
  const organizationId = getOrganizationId();

  const supervisorId = identity.employeeIdWithName || cookies.userId || "";

  const now = dayjs();
  const [viewMode, setViewMode] = useState<ViewMode>("Month");
  const [month, setMonth] = useState<number>(now.month());
  const [year, setYear] = useState<number>(now.year());
  // Week navigation: track the start of the current week (Sunday)
  const [weekStart, setWeekStart] = useState<Dayjs>(now.startOf("week"));

  const [entries, setEntries] = useState<TeamCalendarEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const { getHolidayName: getHolidayFromCalendar } = useHolidayCalendar(year);

  // Derive the fetch month/year from either the month state (monthly view)
  // or the week start (weekly view — week may span two months, use week's month)
  const fetchMonth = viewMode === "Month" ? month : weekStart.month();
  const fetchYear = viewMode === "Month" ? year : weekStart.year();

  useEffect(() => {
    let cancelled = false;
    const loadCalendar = async () => {
      if (!organizationId || !supervisorId) return;
      setLoading(true);
      try {
        const data = await HrmLeaveService.getTeamCalendar({
          organizationId,
          managerId: supervisorId,
          month: fetchMonth + 1,
          year: fetchYear,
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
  }, [organizationId, supervisorId, fetchMonth, fetchYear]);

  // The team-calendar response mixes two row kinds: actual leave rows and
  // holiday rows (holiday === true) where every employee/leave field is null.
  // Keep only real leave rows for badges/counts so holidays never inflate the
  // leave count and never reach `.split` on a null employeeName.
  const leaveEntries = useMemo(
    () => entries.filter((e) => !e.holiday && !!e.employeeId),
    [entries],
  );

  // Holiday names surfaced by the team-calendar response, keyed by date.
  const apiHolidaysByDate = useMemo(() => {
    const map: Record<string, string> = {};
    entries.forEach((e) => {
      if (e.holiday && e.holidayName) map[e.date] = e.holidayName;
    });
    return map;
  }, [entries]);

  // Prefer a holiday name from the API response, falling back to the static
  // holiday calendar hook.
  const getHolidayName = useCallback(
    (dateStr: string) => apiHolidaysByDate[dateStr] ?? getHolidayFromCalendar(dateStr),
    [apiHolidaysByDate, getHolidayFromCalendar],
  );

  const entriesByDate = useMemo(() => {
    const map: Record<string, TeamCalendarEntry[]> = {};
    leaveEntries.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [leaveEntries]);

  // ── Week navigation ────────────────────────────────────────────────

  const handlePrevWeek = () => {
    setWeekStart((prev) => prev.subtract(7, "day"));
  };

  const handleNextWeek = () => {
    setWeekStart((prev) => prev.add(7, "day"));
  };

  const handleTodayWeek = () => {
    setWeekStart(dayjs().startOf("week"));
  };

  // ── Month panel change (monthly view) ─────────────────────────────

  const handlePanelChange = (val: Dayjs, _mode: string) => {
    setMonth(val.month());
    setYear(val.year());
  };

  // ── Week header label ─────────────────────────────────────────────

  const weekEnd = weekStart.add(6, "day");
  const weekLabel =
    weekStart.month() === weekEnd.month()
      ? `${weekStart.format("D")} – ${weekEnd.format("D MMM YYYY")}`
      : weekStart.year() === weekEnd.year()
      ? `${weekStart.format("D MMM")} – ${weekEnd.format("D MMM YYYY")}`
      : `${weekStart.format("D MMM YYYY")} – ${weekEnd.format("D MMM YYYY")}`;

  return (
    <div className={styles.calendarWrapper}>
      {/* View toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <Segmented<ViewMode>
          options={["Month", "Week"]}
          value={viewMode}
          onChange={(val) => {
            setViewMode(val);
            // When switching to Week, reset weekStart to the current week
            if (val === "Week") {
              setWeekStart(dayjs().startOf("week"));
            }
          }}
        />

        {/* Week navigation controls */}
        {viewMode === "Week" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={handlePrevWeek}
              style={{
                border: "1px solid #d9d9d9",
                borderRadius: 6,
                background: "#fff",
                padding: "4px 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Previous week"
            >
              <LeftOutlined style={{ fontSize: 11 }} />
            </button>
            <span
              style={{ fontSize: 13, fontWeight: 500, color: "#0f172a", minWidth: 160, textAlign: "center" }}
            >
              {weekLabel}
            </span>
            <button
              onClick={handleNextWeek}
              style={{
                border: "1px solid #d9d9d9",
                borderRadius: 6,
                background: "#fff",
                padding: "4px 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Next week"
            >
              <RightOutlined style={{ fontSize: 11 }} />
            </button>
            <button
              onClick={handleTodayWeek}
              style={{
                border: "1px solid #d9d9d9",
                borderRadius: 6,
                background: "#fff",
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: 12,
                color: "#1890ff",
                fontWeight: 500,
              }}
            >
              Today
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <CalendarLegend />

      {/* Calendar / Week grid */}
      <Spin spinning={loading}>
        {viewMode === "Month" ? (
          <MonthlyView
            month={month}
            year={year}
            entriesByDate={entriesByDate}
            getHolidayName={getHolidayName}
            onPanelChange={handlePanelChange}
          />
        ) : (
          <WeeklyView
            weekStart={weekStart}
            entriesByDate={entriesByDate}
            getHolidayName={getHolidayName}
          />
        )}
      </Spin>
    </div>
  );
};

export default TeamCalendarView;
