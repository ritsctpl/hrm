"use client";

import React, { useMemo } from "react";
import { Select, DatePicker, Space, Switch, Typography } from "antd";
import { LeaveFilterBarProps } from "../../types/ui.types";
import { LEAVE_STATUS_LABELS, HR_ROLES } from "../../utils/constants";
import { useEmployeeOptions } from "../../hooks/useEmployeeOptions";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;

const statusOptions = Object.entries(LEAVE_STATUS_LABELS).map(([v, l]) => ({
  value: v,
  label: l,
}));

const LeaveFilterBar: React.FC<LeaveFilterBarProps> = ({
  role,
  permissions,
  onFilterChange,
}) => {
  const isHr = HR_ROLES.includes(role);

  // Both the Business Unit and Department dropdowns were rendering empty
  // because no options array was wired in. Derive the option lists from
  // the employee directory — same source the rest of the leave module
  // uses for cross-cutting filters. Backend's GlobalQueueRequest accepts
  // `buId` / `deptId` as opaque strings; the directory stores them in
  // each row under the same keys.
  const { employees } = useEmployeeOptions();
  const buOptions = useMemo(() => {
    const bus = new Set<string>();
    for (const emp of employees) {
      const list = (emp as unknown as { businessUnits?: string[] }).businessUnits || [];
      for (const b of list) {
        const trimmed = (b || "").trim();
        if (trimmed) bus.add(trimmed);
      }
    }
    return Array.from(bus).sort().map((b) => ({ value: b, label: b }));
  }, [employees]);
  const deptOptions = useMemo(() => {
    const depts = new Set<string>();
    for (const emp of employees) {
      const d = (emp.department || "").trim();
      if (d) depts.add(d);
    }
    return Array.from(depts).sort().map((d) => ({ value: d, label: d }));
  }, [employees]);

  const handleChange = (key: string, val: string) => {
    if (onFilterChange) onFilterChange({ [key]: val });
  };

  return (
    <div className={styles.filterBar}>
      <Space wrap>
        <Select
          placeholder="Status"
          allowClear
          style={{ width: 180 }}
          options={statusOptions}
          onChange={(v) => handleChange("status", v ?? "")}
        />

        <Select
          placeholder="Leave Type"
          allowClear
          style={{ width: 140 }}
          options={[
            { value: "CL", label: "Casual Leave" },
            { value: "SL", label: "Sick Leave" },
            { value: "PL", label: "Privilege Leave" },
            { value: "CO", label: "Comp Off" },
            { value: "WFH", label: "Work From Home" },
          ]}
          onChange={(v) => handleChange("leaveTypeCode", v ?? "")}
        />

        <DatePicker.RangePicker
          format="DD-MMM-YYYY"
          onChange={(_, dateStrings) => {
            if (onFilterChange) {
              onFilterChange({
                fromDate: dateStrings[0],
                toDate: dateStrings[1],
              });
            }
          }}
        />

        {isHr && permissions.canViewAll && (
          <>
            <Select
              placeholder="Business Unit"
              allowClear
              showSearch
              style={{ width: 180 }}
              options={buOptions}
              onChange={(v) => handleChange("buId", v ?? "")}
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
            <Select
              placeholder="Department"
              allowClear
              showSearch
              style={{ width: 180 }}
              options={deptOptions}
              onChange={(v) => handleChange("deptId", v ?? "")}
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
            <Space>
              <Text style={{ fontSize: 12 }}>SLA Breach Only</Text>
              <Switch
                size="small"
                onChange={(checked) =>
                  handleChange("slaBreachOnly", checked ? "true" : "false")
                }
              />
            </Space>
          </>
        )}
      </Space>
    </div>
  );
};

export default LeaveFilterBar;
