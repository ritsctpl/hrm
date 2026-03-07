"use client";

import React from "react";
import { Tag } from "antd";
import { LEAVE_TYPE_COLORS } from "../../utils/constants";
import { LeaveTypeTagProps } from "../../types/ui.types";

const LeaveTypeTag: React.FC<LeaveTypeTagProps> = ({ code, name }) => {
  const color = LEAVE_TYPE_COLORS[code] ?? "#8c8c8c";
  return (
    <Tag color={color} style={{ fontWeight: 600 }}>
      {name ? `${code} – ${name}` : code}
    </Tag>
  );
};

export default LeaveTypeTag;
