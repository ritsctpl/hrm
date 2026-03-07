"use client";

import React from "react";
import { Select, DatePicker, Space, Switch, Typography } from "antd";
import { LeaveFilterBarProps } from "../../types/ui.types";
import { LEAVE_STATUS_LABELS, HR_ROLES } from "../../utils/constants";
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
              style={{ width: 150 }}
              onChange={(v) => handleChange("buId", v ?? "")}
            />
            <Select
              placeholder="Department"
              allowClear
              style={{ width: 150 }}
              onChange={(v) => handleChange("deptId", v ?? "")}
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
