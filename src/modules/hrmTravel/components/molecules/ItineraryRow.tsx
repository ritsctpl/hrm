"use client";

import React from "react";
import { Form, TimePicker, DatePicker } from "antd";
import type { TravelType } from "../../types/domain.types";
import dayjs from "dayjs";

interface RowErrors {
  travelDate?: string;
  startHour?: string;
  endHour?: string;
  startDate?: string;
  endDate?: string;
}

interface Props {
  travelType: TravelType;
  value?: {
    travelDate?: string;
    startHour?: string;
    endHour?: string;
    startDate?: string;
    endDate?: string;
  };
  onChange?: (field: string, value: string | null) => void;
  readonly?: boolean;
  errors?: RowErrors;
}

const ItineraryRow: React.FC<Props> = ({
  travelType,
  value = {},
  onChange,
  readonly,
  errors = {},
}) => {
  const timeFormat = "HH:mm";
  const dateFormat = "DD/MM/YYYY";

  if (travelType === "LOCAL") {
    return (
      <div style={{ display: "flex", gap: 16 }}>
        <Form.Item
          label="Travel Date"
          required
          style={{ flex: 1 }}
          validateStatus={errors.travelDate ? "error" : undefined}
          help={errors.travelDate}
        >
          <DatePicker
            format={dateFormat}
            disabled={readonly}
            value={value.travelDate ? dayjs(value.travelDate, dateFormat) : null}
            onChange={(_, s) => onChange?.("travelDate", (Array.isArray(s) ? s[0] : s) || null)}
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item
          label="Start Hour"
          required
          style={{ flex: 1 }}
          validateStatus={errors.startHour ? "error" : undefined}
          help={errors.startHour}
        >
          <TimePicker
            format={timeFormat}
            disabled={readonly}
            value={value.startHour ? dayjs(value.startHour, timeFormat) : null}
            onChange={(_, s) => onChange?.("startHour", (Array.isArray(s) ? s[0] : s) || null)}
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item
          label="End Hour"
          required
          style={{ flex: 1 }}
          validateStatus={errors.endHour ? "error" : undefined}
          help={errors.endHour}
        >
          <TimePicker
            format={timeFormat}
            disabled={readonly}
            value={value.endHour ? dayjs(value.endHour, timeFormat) : null}
            onChange={(_, s) => onChange?.("endHour", (Array.isArray(s) ? s[0] : s) || null)}
            style={{ width: "100%" }}
          />
        </Form.Item>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 16 }}>
      <Form.Item
        label="Start Date"
        required
        style={{ flex: 1 }}
        validateStatus={errors.startDate ? "error" : undefined}
        help={errors.startDate}
      >
        <DatePicker
          format={dateFormat}
          disabled={readonly}
          value={value.startDate ? dayjs(value.startDate, dateFormat) : null}
          onChange={(_, s) => onChange?.("startDate", (Array.isArray(s) ? s[0] : s) || null)}
          style={{ width: "100%" }}
        />
      </Form.Item>
      <Form.Item
        label="End Date"
        required
        style={{ flex: 1 }}
        validateStatus={errors.endDate ? "error" : undefined}
        help={errors.endDate}
      >
        <DatePicker
          format={dateFormat}
          disabled={readonly}
          value={value.endDate ? dayjs(value.endDate, dateFormat) : null}
          onChange={(_, s) => onChange?.("endDate", (Array.isArray(s) ? s[0] : s) || null)}
          style={{ width: "100%" }}
        />
      </Form.Item>
    </div>
  );
};

export default ItineraryRow;
