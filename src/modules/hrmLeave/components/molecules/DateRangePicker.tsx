"use client";

import React, { useEffect, useState } from "react";
import { DatePicker, Radio, Space, Typography, Tooltip, Spin } from "antd";
import dayjs from "dayjs";
import { getOrganizationId } from "@/utils/cookieUtils";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { useHolidayCalendar } from "../../hooks/useHolidayCalendar";
import type { DateRangePickerProps, DayType } from "../../types/ui.types";

const { Text } = Typography;

const DAY_TYPE_OPTIONS = [
  { value: "FULL", label: "Full" },
  { value: "FIRST_HALF", label: "AM" },
  { value: "SECOND_HALF", label: "PM" },
];

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  startDayType,
  endDayType,
  halfDayAllowed,
  employeeId,
  onStartDateChange,
  onEndDateChange,
  onTotalDaysChange,
}) => {
  const [calculating, setCalculating] = useState(false);
  const [breakdown, setBreakdown] = useState<{
    calendarDays: number;
    workingDays: number;
    holidaysExcluded: number;
    weekendsExcluded: number;
    holidayNames: string[];
  } | null>(null);

  const { getHolidayName } = useHolidayCalendar();

  // Client-side fallback calculation (used while server call is in flight)
  const calcDaysFallback = (
    start: string | null,
    end: string | null,
    sDayType: DayType,
    eDayType: DayType
  ): number => {
    if (!start || !end) return 0;
    const s = dayjs(start);
    const e = dayjs(end);
    let days = e.diff(s, "day") + 1;
    if (sDayType !== "FULL") days -= 0.5;
    if (eDayType !== "FULL") days -= 0.5;
    return Math.max(0, days);
  };

  // Call backend to calculate actual working days
  useEffect(() => {
    if (!startDate || !endDate || !employeeId) {
      setBreakdown(null);
      return;
    }

    const organizationId = getOrganizationId();
    if (!organizationId) return;

    let cancelled = false;
    setCalculating(true);

    HrmLeaveService.calculateWorkingDays({
      organizationId,
      employeeId,
      startDate,
      endDate,
      startDayType,
      endDayType,
    })
      .then((res) => {
        if (cancelled) return;
        setBreakdown({
          calendarDays: res.calendarDays,
          workingDays: res.calculatedDays,
          holidaysExcluded: res.excludedHolidays.length,
          weekendsExcluded: res.excludedWeekends.length,
          holidayNames: res.excludedHolidays.map((h) => `${h.name} (${h.date})`),
        });
        onTotalDaysChange(res.calculatedDays);
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback to client-side calculation
        const fallback = calcDaysFallback(startDate, endDate, startDayType, endDayType);
        onTotalDaysChange(fallback);
        setBreakdown(null);
      })
      .finally(() => {
        if (!cancelled) setCalculating(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, startDayType, endDayType, employeeId]);

  const handleStartChange = (date: dayjs.Dayjs | null, dayType?: DayType) => {
    const newDate = date ? date.format("YYYY-MM-DD") : null;
    const newDayType = dayType ?? startDayType;
    if (newDate) onStartDateChange(newDate, newDayType);
    // Server calculation triggered by useEffect above
    if (!endDate) {
      const total = calcDaysFallback(newDate, endDate, newDayType, endDayType);
      onTotalDaysChange(total);
    }
  };

  const handleEndChange = (date: dayjs.Dayjs | null, dayType?: DayType) => {
    const newDate = date ? date.format("YYYY-MM-DD") : null;
    const newDayType = dayType ?? endDayType;
    if (newDate) onEndDateChange(newDate, newDayType);
    if (!startDate) {
      const total = calcDaysFallback(startDate, newDate, startDayType, newDayType);
      onTotalDaysChange(total);
    }
  };

  // Highlight holidays in date picker
  const cellRender = (current: dayjs.Dayjs) => {
    const dateStr = current.format("YYYY-MM-DD");
    const holidayName = getHolidayName(dateStr);
    if (holidayName) {
      return (
        <Tooltip title={holidayName}>
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
            }}
          >
            {current.date()}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#ff4d4f",
              }}
            />
          </div>
        </Tooltip>
      );
    }
    return current.date();
  };

  const fallbackDays = calcDaysFallback(startDate, endDate, startDayType, endDayType);

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <div>
        <Text style={{ fontSize: 12, display: "block", marginBottom: 4 }}>From Date</Text>
        <DatePicker
          value={startDate ? dayjs(startDate) : null}
          onChange={(d) => handleStartChange(d)}
          style={{ width: "100%" }}
          format="DD-MMM-YYYY"
          cellRender={(current) => cellRender(current as dayjs.Dayjs)}
        />
        {halfDayAllowed && (
          <Radio.Group
            value={startDayType}
            onChange={(e) =>
              handleStartChange(startDate ? dayjs(startDate) : null, e.target.value)
            }
            size="small"
            style={{ marginTop: 6 }}
          >
            {DAY_TYPE_OPTIONS.map((opt) => (
              <Radio.Button key={opt.value} value={opt.value}>
                {opt.label}
              </Radio.Button>
            ))}
          </Radio.Group>
        )}
      </div>

      <div>
        <Text style={{ fontSize: 12, display: "block", marginBottom: 4 }}>To Date</Text>
        <DatePicker
          value={endDate ? dayjs(endDate) : null}
          onChange={(d) => handleEndChange(d)}
          style={{ width: "100%" }}
          format="DD-MMM-YYYY"
          disabledDate={(d) => (startDate ? d.isBefore(dayjs(startDate), "day") : false)}
          cellRender={(current) => cellRender(current as dayjs.Dayjs)}
        />
        {halfDayAllowed && (
          <Radio.Group
            value={endDayType}
            onChange={(e) =>
              handleEndChange(endDate ? dayjs(endDate) : null, e.target.value)
            }
            size="small"
            style={{ marginTop: 6 }}
          >
            {DAY_TYPE_OPTIONS.map((opt) => (
              <Radio.Button key={opt.value} value={opt.value}>
                {opt.label}
              </Radio.Button>
            ))}
          </Radio.Group>
        )}
      </div>

      {/* Days calculation display */}
      {(fallbackDays > 0 || calculating) && (
        <div style={{ fontSize: 12, color: "#595959" }}>
          {calculating ? (
            <Space size={4}>
              <Spin size="small" />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Calculating working days...
              </Text>
            </Space>
          ) : breakdown ? (
            <div>
              <Text strong style={{ fontSize: 13 }}>
                {breakdown.workingDays.toFixed(1)} working days
              </Text>
              {(breakdown.holidaysExcluded > 0 || breakdown.weekendsExcluded > 0) && (
                <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 2 }}>
                  {breakdown.calendarDays} calendar days
                  {breakdown.holidaysExcluded > 0 &&
                    ` \u2212 ${breakdown.holidaysExcluded} holiday${breakdown.holidaysExcluded > 1 ? "s" : ""}`}
                  {breakdown.weekendsExcluded > 0 &&
                    ` \u2212 ${breakdown.weekendsExcluded} weekend${breakdown.weekendsExcluded > 1 ? "s" : ""}`}
                </Text>
              )}
              {breakdown.holidayNames.length > 0 && (
                <Text type="secondary" style={{ fontSize: 11, display: "block", fontStyle: "italic" }}>
                  Holidays: {breakdown.holidayNames.join(", ")}
                </Text>
              )}
            </div>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Calculated: <strong>{fallbackDays.toFixed(1)} days</strong>
            </Text>
          )}
        </div>
      )}
    </Space>
  );
};

export default DateRangePicker;
