"use client";

import React, { useEffect, useState } from "react";
import { Select, Tag } from "antd";
import { HrmTravelService } from "../../../hrmTravel/services/hrmTravelService";
import type { TravelRequest } from "../../../hrmTravel/types/domain.types";

interface Props {
  organizationId: string;
  employeeId: string;
  value: string | null;
  disabled?: boolean;
  onChange: (handle: string | null, travel?: TravelRequest) => void;
}

const TravelRequestPicker: React.FC<Props> = ({
  organizationId,
  employeeId,
  value,
  disabled,
  onChange,
}) => {
  const [options, setOptions] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!organizationId || !employeeId) return;
    let active = true;
    setLoading(true);
    HrmTravelService.getMyRequests({ organizationId, employeeId, status: "APPROVED" })
      .then((data) => {
        if (active) setOptions(data ?? []);
      })
      .catch((err) => {
        console.error("[Expense] Failed to load travel requests:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId, employeeId]);

  return (
    <Select
      showSearch
      allowClear
      loading={loading}
      disabled={disabled}
      placeholder="Select an approved travel request"
      value={value ?? undefined}
      onChange={(v) => {
        const picked = options.find((t) => t.handle === v);
        onChange(v ?? null, picked);
      }}
      filterOption={(input, option) =>
        (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
      }
      options={options.map((t) => ({
        value: t.handle,
        label: `${t.requestId} — ${t.destinationCity} (${t.travelType})`,
      }))}
      notFoundContent={loading ? "Loading..." : "No approved travel requests"}
      style={{ width: "100%" }}
      optionRender={(option) => {
        const t = options.find((x) => x.handle === option.value);
        if (!t) return option.label;
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{t.requestId} — {t.destinationCity}</div>
            <div style={{ fontSize: 12, color: "#888" }}>
              {t.startDate ? `${t.startDate} → ${t.endDate ?? "—"}` : t.travelDate}
              {" "}
              <Tag color="blue" style={{ marginLeft: 4 }}>{t.travelType}</Tag>
            </div>
          </div>
        );
      }}
    />
  );
};

export default TravelRequestPicker;
