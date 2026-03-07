"use client";

import React from "react";
import { Input, Select, DatePicker } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useHrmTravelStore } from "../../stores/hrmTravelStore";
import styles from "../../styles/Travel.module.css";

const { RangePicker } = DatePicker;

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending" },
  { value: "ESCALATED", label: "Escalated" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "LOCAL", label: "Local" },
  { value: "DOMESTIC", label: "Domestic" },
  { value: "OVERSEAS", label: "Overseas" },
];

interface Props {
  onSearch?: () => void;
}

const TravelSearchBar: React.FC<Props> = ({ onSearch }) => {
  const { searchTerm, statusFilter, typeFilter, setSearchTerm, setStatusFilter, setTypeFilter, setDateRange } =
    useHrmTravelStore();

  return (
    <div className={styles.toolbar}>
      <Input
        prefix={<SearchOutlined />}
        placeholder="Search by purpose / destination..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onPressEnter={onSearch}
        style={{ width: 280 }}
        allowClear
      />
      <Select
        value={statusFilter ?? ""}
        onChange={(v) => setStatusFilter(v || null)}
        options={STATUS_OPTIONS}
        style={{ width: 150 }}
      />
      <Select
        value={typeFilter ?? ""}
        onChange={(v) => setTypeFilter(v || null)}
        options={TYPE_OPTIONS}
        style={{ width: 130 }}
      />
      <RangePicker
        style={{ width: 230 }}
        format="DD/MM/YYYY"
        onChange={(_, strings) => {
          if (strings[0] && strings[1]) {
            setDateRange([strings[0], strings[1]]);
          } else {
            setDateRange(null);
          }
        }}
      />
    </div>
  );
};

export default TravelSearchBar;
