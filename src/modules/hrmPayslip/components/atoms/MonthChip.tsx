'use client';

import React from "react";
import { Tag } from "antd";

interface Props {
  month: number;
  label: string;
  selected: boolean;
  available: boolean;
  onClick: (month: number) => void;
}

const MonthChip: React.FC<Props> = ({ month, label, selected, available, onClick }) => {
  return (
    <Tag
      color={selected ? "blue" : available ? "default" : undefined}
      style={{
        cursor: available ? "pointer" : "default",
        opacity: available ? 1 : 0.4,
        fontSize: 13,
        padding: "4px 12px",
        fontWeight: selected ? 700 : 400,
      }}
      onClick={() => available && onClick(month)}
    >
      {label}
    </Tag>
  );
};

export default MonthChip;
