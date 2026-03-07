"use client";

import React from "react";
import { Tag } from "antd";
import type { TravelStatus } from "../../types/domain.types";
import { TRAVEL_STATUS_COLORS, TRAVEL_STATUS_LABELS } from "../../utils/travelConstants";

interface Props {
  status: TravelStatus;
  size?: "sm" | "md";
}

const TravelStatusChip: React.FC<Props> = ({ status, size = "md" }) => {
  return (
    <Tag
      color={TRAVEL_STATUS_COLORS[status]}
      style={size === "sm" ? { fontSize: 11, padding: "0 6px", lineHeight: "18px" } : undefined}
    >
      {TRAVEL_STATUS_LABELS[status] ?? status}
    </Tag>
  );
};

export default TravelStatusChip;
