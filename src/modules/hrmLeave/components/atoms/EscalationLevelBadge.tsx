"use client";

import React from "react";
import { Tag } from "antd";
import { EscalationLevelBadgeProps } from "../../types/ui.types";

const levelColors: Record<number, string> = {
  0: "default",
  1: "orange",
  2: "red",
};

const EscalationLevelBadge: React.FC<EscalationLevelBadgeProps> = ({ level }) => {
  if (level === 0) return null;
  return (
    <Tag color={levelColors[level] ?? "red"} style={{ fontSize: 11 }}>
      ESC Lv.{level}
    </Tag>
  );
};

export default EscalationLevelBadge;
