"use client";

import React from "react";
import { Tag, Tooltip } from "antd";
import type { ExpenseStatus } from "../../types/domain.types";
import {
  EXPENSE_STATUS_COLORS,
  EXPENSE_STATUS_LABELS,
  EXPENSE_STATUS_BUCKET,
  EXPENSE_BUCKET_LABELS,
  EXPENSE_BUCKET_COLORS,
} from "../../utils/expenseConstants";

interface Props {
  status: ExpenseStatus;
  size?: "sm" | "md";
  /**
   * When true, render the user-facing bucket (Draft / Awaiting / Paid / Closed).
   * Detailed status is shown in the tooltip so reviewers can still see the precise state.
   */
  bucketed?: boolean;
}

const ExpenseStatusChip: React.FC<Props> = ({ status, size = "md", bucketed = false }) => {
  const sizedStyle =
    size === "sm" ? { fontSize: 11, padding: "0 6px", lineHeight: "18px" } : undefined;

  if (bucketed) {
    const bucket = EXPENSE_STATUS_BUCKET[status] ?? "CLOSED";
    return (
      <Tooltip title={EXPENSE_STATUS_LABELS[status] ?? status}>
        <Tag color={EXPENSE_BUCKET_COLORS[bucket]} style={sizedStyle}>
          {EXPENSE_BUCKET_LABELS[bucket]}
        </Tag>
      </Tooltip>
    );
  }

  return (
    <Tag color={EXPENSE_STATUS_COLORS[status]} style={sizedStyle}>
      {EXPENSE_STATUS_LABELS[status] ?? status}
    </Tag>
  );
};

export default ExpenseStatusChip;
