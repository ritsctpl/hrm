"use client";

import React from "react";
import { Input, Select, DatePicker } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useHrmExpenseStore } from "../../stores/hrmExpenseStore";
import styles from "../../styles/Expense.module.css";

const { RangePicker } = DatePicker;

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_SUPERVISOR", label: "Pending Supervisor" },
  { value: "ESCALATED", label: "Escalated" },
  { value: "PENDING_FINANCE", label: "Pending Finance" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "PAID", label: "Paid" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "ADVANCE", label: "Advance" },
  { value: "REIMBURSEMENT", label: "Reimbursement" },
  { value: "MILEAGE", label: "Mileage" },
];

interface Props {
  onSearch?: () => void;
}

const ExpenseSearchBar: React.FC<Props> = ({ onSearch }) => {
  const { searchTerm, statusFilter, typeFilter, setSearchTerm, setStatusFilter, setTypeFilter, setDateRange } =
    useHrmExpenseStore();

  return (
    <div className={styles.toolbar}>
      <Input
        prefix={<SearchOutlined />}
        placeholder="Search by purpose / travel ref..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onPressEnter={onSearch}
        style={{ width: 280 }}
        allowClear
      />
      <Select
        value={typeFilter ?? ""}
        onChange={(v) => setTypeFilter(v || null)}
        options={TYPE_OPTIONS}
        style={{ width: 150 }}
      />
      <Select
        value={statusFilter ?? ""}
        onChange={(v) => setStatusFilter(v || null)}
        options={STATUS_OPTIONS}
        style={{ width: 170 }}
      />
      <RangePicker
        style={{ width: 230 }}
        format="DD/MM/YYYY"
        onChange={(_, strings) => {
          if (strings[0] && strings[1]) setDateRange([strings[0], strings[1]]);
          else setDateRange(null);
        }}
      />
    </div>
  );
};

export default ExpenseSearchBar;
