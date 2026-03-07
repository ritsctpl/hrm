"use client";

import React from "react";
import { Tag } from "antd";
import type { SlaInfo } from "../../types/ui.types";

interface Props {
  sla: SlaInfo;
}

const SlaIndicator: React.FC<Props> = ({ sla }) => {
  if (!sla.label) return null;
  return (
    <Tag color={sla.isOverdue ? "error" : sla.color === "warning" ? "warning" : "success"}>
      {sla.isOverdue ? "Overdue" : sla.label}
    </Tag>
  );
};

export default SlaIndicator;
