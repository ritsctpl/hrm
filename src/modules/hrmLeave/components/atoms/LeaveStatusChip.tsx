"use client";

import React from "react";
import { Tag } from "antd";
import { LEAVE_STATUS_COLORS, LEAVE_STATUS_LABELS } from "../../utils/constants";
import { LeaveStatusChipProps } from "../../types/ui.types";

const LeaveStatusChip: React.FC<LeaveStatusChipProps> = ({ status }) => {
  const color = LEAVE_STATUS_COLORS[status] ?? "default";
  const label = LEAVE_STATUS_LABELS[status] ?? status;
  return <Tag color={color}>{label}</Tag>;
};

export default LeaveStatusChip;
