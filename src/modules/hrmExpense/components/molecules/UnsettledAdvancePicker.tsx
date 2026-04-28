"use client";

import React, { useEffect, useState } from "react";
import { Select, Tag } from "antd";
import { HrmExpenseService } from "../../services/hrmExpenseService";
import type { UnsettledAdvance } from "../../types/api.types";

interface Props {
  organizationId: string;
  employeeId: string;
  value: string | null;
  disabled?: boolean;
  onChange: (handle: string | null, advance?: UnsettledAdvance) => void;
}

const UnsettledAdvancePicker: React.FC<Props> = ({
  organizationId,
  employeeId,
  value,
  disabled,
  onChange,
}) => {
  const [options, setOptions] = useState<UnsettledAdvance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!organizationId || !employeeId) return;
    let active = true;
    setLoading(true);
    HrmExpenseService.getUnsettledAdvances({ organizationId, empId: employeeId })
      .then((data) => {
        if (active) setOptions(data ?? []);
      })
      .catch((err) => {
        console.error("[Expense] Failed to load unsettled advances:", err);
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
      placeholder="Link an unsettled advance (optional)"
      value={value ?? undefined}
      onChange={(v) => {
        const picked = options.find((a) => a.handle === v);
        onChange(v ?? null, picked);
      }}
      filterOption={(input, option) =>
        (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
      }
      options={options.map((a) => ({
        value: a.handle,
        label: `${a.travelPurpose} — ${a.currency} ${a.amount.toLocaleString()}`,
      }))}
      notFoundContent={loading ? "Loading..." : "No unsettled advances"}
      style={{ width: "100%" }}
      optionRender={(option) => {
        const a = options.find((x) => x.handle === option.value);
        if (!a) return option.label;
        return (
          <div>
            <div style={{ fontWeight: 500 }}>
              {a.travelPurpose} — {a.currency} {a.amount.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>
              Approved: {a.approvedAt}
              <Tag color="orange" style={{ marginLeft: 8 }}>
                {a.daysOutstanding}d outstanding
              </Tag>
            </div>
          </div>
        );
      }}
    />
  );
};

export default UnsettledAdvancePicker;
