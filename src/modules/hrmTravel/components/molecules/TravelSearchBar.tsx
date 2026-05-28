"use client";

import React, { useCallback } from "react";
import { Input, Select, DatePicker, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
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
  { value: "INTERNATIONAL", label: "International" },
];

interface Props {
  onSearch?: () => void;
}

const TravelSearchBar: React.FC<Props> = ({ onSearch }) => {
  const { searchTerm, statusFilter, typeFilter, setSearchTerm, setStatusFilter, setTypeFilter, setDateRange } =
    useHrmTravelStore();

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, [setSearchTerm]);

  const handleStatusChange = useCallback((v: string) => {
    setStatusFilter(v || null);
  }, [setStatusFilter]);

  const handleTypeChange = useCallback((v: string) => {
    setTypeFilter(v || null);
  }, [setTypeFilter]);

  const handleDateRangeChange = useCallback((_, strings: [string, string]) => {
    if (strings[0] && strings[1]) {
      const from = dayjs(strings[0], "DD/MM/YYYY").format("YYYY-MM-DD");
      const to = dayjs(strings[1], "DD/MM/YYYY").format("YYYY-MM-DD");
      setDateRange([from, to]);
    } else {
      setDateRange(null);
    }
  }, [setDateRange]);

  const handleGoClick = useCallback(() => {
    onSearch?.();
  }, [onSearch]);

  return (
    <div className={styles.toolbar} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <Input
        prefix={<SearchOutlined />}
        placeholder="Search by Req ID / Purpose..."
        value={searchTerm}
        onChange={(e) => handleSearchChange(e.target.value)}
        onPressEnter={onSearch}
        style={{ width: 280 }}
        allowClear
        onClear={() => { setSearchTerm(""); onSearch?.(); }}
      />
      <Select
        value={statusFilter ?? ""}
        onChange={handleStatusChange}
        options={STATUS_OPTIONS}
        style={{ width: 150 }}
      />
      <Select
        value={typeFilter ?? ""}
        onChange={handleTypeChange}
        options={TYPE_OPTIONS}
        style={{ width: 130 }}
      />
      <RangePicker
        style={{ width: 230 }}
        format="DD/MM/YYYY"
        onChange={handleDateRangeChange}
      />
      <div style={{ marginLeft: "auto" }}>
        <Button type="primary" onClick={handleGoClick}>
          Go
        </Button>
      </div>
    </div>
  );
};

export default TravelSearchBar;
