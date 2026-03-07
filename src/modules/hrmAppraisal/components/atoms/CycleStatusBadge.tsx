'use client';

import React from "react";
import { Badge } from "antd";
import type { CycleStatus } from "../../types/domain.types";

const STATUS_MAP: Record<CycleStatus, { status: "success" | "processing" | "warning" | "error" | "default"; text: string }> = {
  DRAFT: { status: "default", text: "Draft" },
  GOAL_SETTING: { status: "processing", text: "Goal Setting" },
  IN_PROGRESS: { status: "processing", text: "In Progress" },
  CALIBRATION: { status: "warning", text: "Calibration" },
  COMPLETED: { status: "success", text: "Completed" },
  ARCHIVED: { status: "default", text: "Archived" },
};

interface Props {
  status: CycleStatus;
}

const CycleStatusBadge: React.FC<Props> = ({ status }) => {
  const config = STATUS_MAP[status] ?? { status: "default" as const, text: status };
  return <Badge status={config.status} text={config.text} />;
};

export default CycleStatusBadge;
