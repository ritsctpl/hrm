'use client';

import React from "react";
import { Tag } from "antd";
import type { GoalStatus } from "../../types/domain.types";

const STATUS_COLORS: Record<GoalStatus, string> = {
  DRAFT: "default",
  SUBMITTED: "processing",
  APPROVED: "green",
  IN_PROGRESS: "blue",
  COMPLETED: "success",
  DEFERRED: "warning",
  CANCELLED: "error",
};

interface Props {
  status: GoalStatus;
}

const GoalStatusTag: React.FC<Props> = ({ status }) => (
  <Tag color={STATUS_COLORS[status] ?? "default"}>
    {status.replace(/_/g, " ")}
  </Tag>
);

export default GoalStatusTag;
