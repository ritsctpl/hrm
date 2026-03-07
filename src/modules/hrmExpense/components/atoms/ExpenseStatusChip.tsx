"use client";

import React from "react";
import { Tag } from "antd";
import type { ExpenseStatus } from "../../types/domain.types";
import { EXPENSE_STATUS_COLORS, EXPENSE_STATUS_LABELS } from "../../utils/expenseConstants";

interface Props {
  status: ExpenseStatus;
  size?: "sm" | "md";
}

const ExpenseStatusChip: React.FC<Props> = ({ status, size = "md" }) => {
  return (
    <Tag
      color={EXPENSE_STATUS_COLORS[status]}
      style={size === "sm" ? { fontSize: 11, padding: "0 6px", lineHeight: "18px" } : undefined}
    >
      {EXPENSE_STATUS_LABELS[status] ?? status}
    </Tag>
  );
};

export default ExpenseStatusChip;
