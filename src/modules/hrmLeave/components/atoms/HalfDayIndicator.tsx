"use client";

import React from "react";
import { Tooltip } from "antd";
import { HalfDayIndicatorProps } from "../../types/ui.types";
import { DAY_TYPE_LABELS } from "../../utils/constants";

const HalfDayIndicator: React.FC<HalfDayIndicatorProps> = ({ dayType }) => {
  if (dayType === "FULL") return null;

  const label = DAY_TYPE_LABELS[dayType] ?? dayType;
  const isAM = dayType === "FIRST_HALF";

  return (
    <Tooltip title={label}>
      <span
        style={{
          display: "inline-block",
          width: 14,
          height: 14,
          borderRadius: 2,
          background: isAM
            ? "linear-gradient(135deg, #1890ff 50%, transparent 50%)"
            : "linear-gradient(135deg, transparent 50%, #1890ff 50%)",
          border: "1px solid #1890ff",
          verticalAlign: "middle",
          marginLeft: 4,
        }}
      />
    </Tooltip>
  );
};

export default HalfDayIndicator;
