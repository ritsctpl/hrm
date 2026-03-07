"use client";

import React from "react";
import { DatePicker, Radio, Space, Typography } from "antd";
import dayjs from "dayjs";
import { DateRangePickerProps, DayType } from "../../types/ui.types";
import { DAY_TYPE_LABELS } from "../../utils/constants";

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
  onStartDateChange,
  onEndDateChange,
  onTotalDaysChange,
}) => {
  const calcDays = (
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

  const handleStartChange = (date: dayjs.Dayjs | null, dayType?: DayType) => {
    const newDate = date ? date.format("YYYY-MM-DD") : null;
    const newDayType = dayType ?? startDayType;
    if (newDate) onStartDateChange(newDate, newDayType);
    const total = calcDays(newDate, endDate, newDayType, endDayType);
    onTotalDaysChange(total);
  };

  const handleEndChange = (date: dayjs.Dayjs | null, dayType?: DayType) => {
    const newDate = date ? date.format("YYYY-MM-DD") : null;
    const newDayType = dayType ?? endDayType;
    if (newDate) onEndDateChange(newDate, newDayType);
    const total = calcDays(startDate, newDate, startDayType, newDayType);
    onTotalDaysChange(total);
  };

  const calculated = calcDays(startDate, endDate, startDayType, endDayType);

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <div>
        <Text style={{ fontSize: 12, display: "block", marginBottom: 4 }}>From Date</Text>
        <DatePicker
          value={startDate ? dayjs(startDate) : null}
          onChange={(d) => handleStartChange(d)}
          style={{ width: "100%" }}
          format="DD-MMM-YYYY"
        />
        {halfDayAllowed && (
          <Radio.Group
            value={startDayType}
            onChange={(e) => handleStartChange(startDate ? dayjs(startDate) : null, e.target.value)}
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
          disabledDate={(d) =>
            startDate ? d.isBefore(dayjs(startDate), "day") : false
          }
        />
        {halfDayAllowed && (
          <Radio.Group
            value={endDayType}
            onChange={(e) => handleEndChange(endDate ? dayjs(endDate) : null, e.target.value)}
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

      {calculated > 0 && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Calculated: <strong>{calculated.toFixed(1)} days</strong>
        </Text>
      )}
    </Space>
  );
};

export default DateRangePicker;
