"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button, DatePicker, Empty, Select, Space, Table, Typography, message } from "antd";
import { ReloadOutlined, DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import type { TravelRequest, TravelType } from "../../types/domain.types";
import TravelStatusChip from "../atoms/TravelStatusChip";
import TravelTypeTag from "../atoms/TravelTypeTag";
import TravelScreenHeader from "./TravelScreenHeader";
import styles from "../../styles/TravelList.module.css";

const { Text } = Typography;
const { RangePicker } = DatePicker;

export type TravelReportFetcher = (params: {
  organizationId: string;
  empId: string;
  fromDate?: string;
  toDate?: string;
  travelType?: TravelType;
  status?: string;
  currentApproverId?: string;
}) => Promise<unknown>;

interface Props {
  title: string;
  description?: string;
  organizationId: string;
  empId: string;
  fetcher: TravelReportFetcher;
  /** When true, requires a date range before fetching. Default false. */
  requireDateRange?: boolean;
  /** Default lookback window. Default 30 days. */
  defaultDays?: number;
  /** When true, shows a travel-type filter. Default false. */
  showTypeFilter?: boolean;
  /** When true, removes pagination and uses dynamic table height. Default false. */
  noPagination?: boolean;
}

const TRAVEL_TYPE_OPTIONS = [
  { label: "All Types", value: "" },
  { label: "Local", value: "LOCAL" },
  { label: "Domestic", value: "DOMESTIC" },
  { label: "International", value: "INTERNATIONAL" },
];

const TravelReportScreen: React.FC<Props> = ({
  title,
  description,
  organizationId,
  empId,
  fetcher,
  requireDateRange,
  defaultDays = 30,
  showTypeFilter,
  noPagination = false,
}) => {
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().subtract(defaultDays, "day"),
    dayjs(),
  ]);
  const [travelType, setTravelType] = useState<string>("");
  const [data, setData] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (requireDateRange && (!range || !range[0] || !range[1])) {
      message.warning("Please pick a date range to run this report.");
      return;
    }
    setLoading(true);
    try {
      const result = await fetcher({
        organizationId,
        empId,
        fromDate: range?.[0]?.format("YYYY-MM-DD"),
        toDate: range?.[1]?.format("YYYY-MM-DD"),
        travelType: (travelType || undefined) as TravelType | undefined,
        status: "ALL", // Include all statuses: DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED, RECALLED
        currentApproverId: empId, // Pass current approver ID for filtering
      });
      let filtered = Array.isArray(result) ? (result as TravelRequest[]) : [];
      
      // Filter out RECALLED, DRAFT, CANCELLED statuses
      filtered = filtered.filter(
        (r) => !["RECALLED", "DRAFT", "CANCELLED"].includes(r.status)
      );
      
      // Show only records where currentApproverId matches logged-in employee
      filtered = filtered.filter((r) => r.currentApproverId === empId);
      
      setData(filtered);
    } catch {
      message.error(`Failed to load ${title.toLowerCase()}.`);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fetcher, organizationId, empId, range, travelType, requireDateRange, title]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  // Auto-load when date range or travel type changes (for reports with requireDateRange)
  useEffect(() => {
    if (requireDateRange && range && range[0] && range[1]) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, travelType, requireDateRange]);

  const exportCsv = () => {
    if (data.length === 0) {
      message.warning("Nothing to export.");
      return;
    }
    const header = [
      "Request ID",
      "Employee",
      "Type",
      "Purpose",
      "Destination",
      "Status",
      "Submitted",
      "SLA Deadline",
      "Escalation Level",
    ];
    const rows = data.map((r) => [
      r.requestId,
      r.employeeName,
      r.travelType,
      r.purpose,
      [r.destinationCity, r.destinationState, r.destinationCountry].filter(Boolean).join(" / "),
      r.status,
      r.submittedAt ?? "",
      r.slaDeadline ?? "",
      r.escalationLevel ?? 0,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    // Prepend UTF-8 BOM so Excel renders non-ASCII employee / city
    // names correctly (without it, names with diacritics or Tamil /
    // Hindi characters appear garbled).
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const columns: ColumnsType<TravelRequest> = [
    {
      title: "Req ID",
      dataIndex: "requestId",
      width: 110,
      render: (id) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{id}</span>,
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      width: 150,
    },
    {
      title: "Employee",
      dataIndex: "employeeName",
      width: 160,
    },
    {
      title: "Type",
      key: "type",
      width: 100,
      render: (_, r) => <TravelTypeTag travelType={r.travelType} />,
    },
    {
      title: "Destination",
      key: "destination",
      width: 180,
      render: (_, r) =>
        [r.destinationCity, r.destinationState, r.destinationCountry].filter(Boolean).join(", "),
    },
    {
      title: "Submitted",
      key: "submitted",
      width: 110,
      render: (_, r) => (r.createdDateTime ? dayjs(r.createdDateTime).format("DD MMM YYYY") : "—"),
    },
    {
      title: "Status",
      key: "status",
      width: 150,
      render: (_, r) => <TravelStatusChip status={r.status} size="sm" />,
    },
  ];

  return (
    <div
      className={styles.tableWrapper}
      style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}
    >
      <TravelScreenHeader
        title={title}
        actions={
          <Space>
            {showTypeFilter && (
              <Select
                value={travelType}
                onChange={setTravelType}
                options={TRAVEL_TYPE_OPTIONS}
                style={{ width: 140 }}
              />
            )}
            <RangePicker
              value={range as never}
              onChange={(v) => setRange(v as [Dayjs, Dayjs] | null)}
              format="DD/MM/YYYY"
              allowClear={!requireDateRange}
            />
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              Run
            </Button>
            <Button icon={<DownloadOutlined />} onClick={exportCsv} disabled={data.length === 0}>
              Export CSV
            </Button>
          </Space>
        }
      />
      {description && (
        <div style={{ padding: "8px 16px", background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {description}
          </Text>
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <Table
          rowKey="handle"
          size="small"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={noPagination ? false : { pageSize: 25, showSizeChanger: true }}
          locale={{ emptyText: <Empty description="No records for the selected criteria." /> }}
        />
      </div>
      {!noPagination && (
        <div className={styles.recordCount}>
          Showing {data.length} record{data.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
};

export default TravelReportScreen;
