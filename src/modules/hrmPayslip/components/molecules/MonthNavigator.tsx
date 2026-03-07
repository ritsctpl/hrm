'use client';

import React from "react";
import { Button, Select } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import MonthChip from "../atoms/MonthChip";
import { MONTHS } from "../../utils/payslipConstants";

interface Props {
  year: number;
  selectedMonth: number;
  availableMonths: number[];
  onYearChange: (year: number) => void;
  onMonthSelect: (month: number) => void;
}

const MonthNavigator: React.FC<Props> = ({
  year,
  selectedMonth,
  availableMonths,
  onYearChange,
  onMonthSelect,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Button
          icon={<LeftOutlined />}
          size="small"
          disabled={year <= currentYear - 4}
          onClick={() => onYearChange(year - 1)}
        />
        <Select
          value={year}
          size="small"
          style={{ width: 90 }}
          onChange={onYearChange}
          options={Array.from({ length: 5 }, (_, i) => ({
            value: currentYear - i,
            label: String(currentYear - i),
          }))}
        />
        <Button
          icon={<RightOutlined />}
          size="small"
          disabled={year >= currentYear}
          onClick={() => onYearChange(year + 1)}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {MONTHS.map((m) => (
          <MonthChip
            key={m.value}
            month={m.value}
            label={m.label}
            selected={selectedMonth === m.value}
            available={availableMonths.includes(m.value)}
            onClick={onMonthSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default MonthNavigator;
