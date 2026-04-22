"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button, DatePicker, Empty, Space, Table, Typography, message } from "antd";
import { ReloadOutlined, DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import type { ExpenseReport } from "../../types/domain.types";
import ExpenseStatusChip from "../atoms/ExpenseStatusChip";
import ExpenseTypeTag from "../atoms/ExpenseTypeTag";
import OutOfPolicyIcon from "../atoms/OutOfPolicyIcon";
import ExpenseScreenHeader from "./ExpenseScreenHeader";
import styles from "../../styles/ExpenseList.module.css";

const { Text } = Typography;
const { RangePicker } = DatePicker;

export type ExpenseReportFetcher = (params: {
  organizationId: string;
  fromDate?: string;
  toDate?: string;
}) => Promise<ExpenseReport[]>;

interface Props {
  title: string;
  description?: string;
  organizationId: string;
  fetcher: ExpenseReportFetcher;
  /** When true, requires a date range before fetching. Default: false */
  requireDateRange?: boolean;
  /** Optional default date range (last N days). Default: 30 */
  defaultDays?: number;
  /** Extra columns specific to this report */
  extraColumns?: ColumnsType<ExpenseReport>;
}

const formatINR = (amt?: number) =>
  amt == null ? "—" : amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ExpenseReportScreen: React.FC<Props> = ({
  title,
  description,
  organizationId,
  fetcher,
  requireDateRange,
  defaultDays = 30,
  extraColumns = [],
}) => {
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().subtract(defaultDays, "day"),
    dayjs(),
  ]);
  const [data, setData] = useState<ExpenseReport[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (requireDateRange && (!range || !range[0] || !range[1])) {
      message.warning("Please pick a date range to run this report.");
      return;
    }
    setLoading(true);
    try {
      const rows = await fetcher({
        organizationId,
        fromDate: range?.[0]?.format("YYYY-MM-DD"),
        toDate: range?.[1]?.format("YYYY-MM-DD"),
      });
      setData(Array.isArray(rows) ? rows : []);
    } catch {
      message.error(`Failed to load ${title.toLowerCase()}.`);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fetcher, organizationId, range, requireDateRange, title]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const exportCsv = () => {
    if (data.length === 0) {
      message.warning("Nothing to export.");
      return;
    }
    const header = [
      "Report ID",
      "Employee",
      "Type",
      "Status",
      "Amount",
      "Currency",
      "INR Amount",
      "Out Of Policy",
      "Submitted At",
    ];
    const rows = data.map((r) => [
      r.requestId,
      r.employeeName,
      r.expenseType,
      r.status,
      r.totalClaimedAmount,
      r.currency,
      r.totalClaimedAmountInr,
      r.outOfPolicy ? "YES" : "NO",
      r.submittedAt ?? "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const columns: ColumnsType<ExpenseReport> = [
    {
      title: "Report ID",
      dataIndex: "requestId",
      width: 120,
      render: (id) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{id}</span>,
    },
    {
      title: "Employee",
      dataIndex: "employeeName",
      width: 180,
    },
    {
      title: "Type",
      key: "type",
      width: 140,
      render: (_, r) => (
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <ExpenseTypeTag expenseType={r.expenseType} />
          {r.outOfPolicy && <OutOfPolicyIcon />}
        </span>
      ),
    },
    {
      title: "Amount",
      key: "amount",
      width: 140,
      render: (_, r) => (
        <span style={{ fontSize: 13 }}>
          {r.currency} {formatINR(r.totalClaimedAmount)}
        </span>
      ),
    },
    {
      title: "Submitted",
      key: "submittedAt",
      width: 110,
      render: (_, r) => (r.submittedAt ? dayjs(r.submittedAt).format("DD MMM YYYY") : "—"),
    },
    {
      title: "Status",
      key: "status",
      width: 150,
      render: (_, r) => <ExpenseStatusChip status={r.status} size="sm" />,
    },
    ...extraColumns,
  ];

  return (
    <div className={styles.tableWrapper} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ExpenseScreenHeader
        title={title}
        actions={
          <Space>
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
      <div style={{ flex: 1, overflow: "auto" }}>
        <Table
          rowKey="handle"
          size="small"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 25, showSizeChanger: true }}
          locale={{ emptyText: <Empty description="No records for the selected criteria." /> }}
        />
      </div>
      <div className={styles.recordCount}>
        Showing {data.length} record{data.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

export default ExpenseReportScreen;
