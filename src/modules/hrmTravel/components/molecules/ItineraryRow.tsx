"use client";

import React from "react";
import { Form, Input, TimePicker, DatePicker } from "antd";
import type { TravelType } from "../../types/domain.types";
import dayjs from "dayjs";

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
}

const ItineraryRow: React.FC<Props> = ({ travelType, value = {}, onChange, readonly }) => {
  const timeFormat = "HH:mm";
  const dateFormat = "DD/MM/YYYY";

  if (travelType === "LOCAL") {
    return (
      <div style={{ display: "flex", gap: 16 }}>
        <Form.Item label="Travel Date" style={{ flex: 1 }}>
          <DatePicker
            format={dateFormat}
            disabled={readonly}
            value={value.travelDate ? dayjs(value.travelDate) : null}
            onChange={(_, s) => onChange?.("travelDate", (Array.isArray(s) ? s[0] : s) || null)}
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item label="Start Hour" style={{ flex: 1 }}>
          <TimePicker
            format={timeFormat}
            disabled={readonly}
            value={value.startHour ? dayjs(value.startHour, timeFormat) : null}
            onChange={(_, s) => onChange?.("startHour", (Array.isArray(s) ? s[0] : s) || null)}
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item label="End Hour" style={{ flex: 1 }}>
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
      <Form.Item label="Start Date" style={{ flex: 1 }}>
        <DatePicker
          format={dateFormat}
          disabled={readonly}
          value={value.startDate ? dayjs(value.startDate) : null}
          onChange={(_, s) => onChange?.("startDate", (Array.isArray(s) ? s[0] : s) || null)}
          style={{ width: "100%" }}
        />
      </Form.Item>
      <Form.Item label="End Date" style={{ flex: 1 }}>
        <DatePicker
          format={dateFormat}
          disabled={readonly}
          value={value.endDate ? dayjs(value.endDate) : null}
          onChange={(_, s) => onChange?.("endDate", (Array.isArray(s) ? s[0] : s) || null)}
          style={{ width: "100%" }}
        />
      </Form.Item>
    </div>
  );
};

export default ItineraryRow;
