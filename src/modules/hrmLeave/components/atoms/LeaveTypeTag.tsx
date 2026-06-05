"use client";

import React from "react";
import { Tag } from "antd";
import { getLeaveTypeColor } from "../../utils/constants";
import { LeaveTypeTagProps } from "../../types/ui.types";

const LeaveTypeTag: React.FC<LeaveTypeTagProps> = ({ code, name }) => {
  const color = getLeaveTypeColor(code);
  return (
    <Tag color={color} style={{ fontWeight: 600 }}>
      {name ? `${code} – ${name}` : code}
    </Tag>
  );
};

export default LeaveTypeTag;
