"use client";

import React from "react";
import { Tag } from "antd";
import type { ExpenseType } from "../../types/domain.types";
import { EXPENSE_TYPE_COLORS, EXPENSE_TYPE_LABELS } from "../../utils/expenseConstants";

interface Props {
  expenseType: ExpenseType;
}

const ExpenseTypeTag: React.FC<Props> = ({ expenseType }) => {
  return (
    <Tag color={EXPENSE_TYPE_COLORS[expenseType]}>
      {EXPENSE_TYPE_LABELS[expenseType]}
    </Tag>
  );
};

export default ExpenseTypeTag;
