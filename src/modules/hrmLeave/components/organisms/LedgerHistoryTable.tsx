"use client";

import React from "react";
import { Table, Tag, Empty, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import DirectionTag from "../atoms/DirectionTag";
import LeaveTypeTag from "../atoms/LeaveTypeTag";
import { LedgerHistoryTableProps } from "../../types/ui.types";
import { LedgerEntry } from "../../types/domain.types";
import { LEDGER_REF_TYPE_LABELS } from "../../utils/constants";

const { Text } = Typography;

const columns: ColumnsType<LedgerEntry> = [
  {
    title: "Date",
    dataIndex: "transactionDate",
    key: "date",
    width: 110,
    render: (v: string) =>
      new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
  },
  {
    title: "Type",
    dataIndex: "leaveTypeCode",
    key: "type",
    width: 80,
    render: (code: string) => <LeaveTypeTag code={code} />,
  },
  {
    title: "Ref",
    dataIndex: "refType",
    key: "refType",
    width: 120,
    render: (v: string) => LEDGER_REF_TYPE_LABELS[v] ?? v,
  },
  {
    title: "Dir",
    dataIndex: "direction",
    key: "direction",
    width: 60,
    render: (v: "CR" | "DR") => <DirectionTag direction={v} />,
  },
  {
    title: "Qty",
    dataIndex: "quantity",
    key: "quantity",
    width: 70,
    render: (v: number) => v.toFixed(1),
    align: "right",
  },
  {
    title: "Balance",
    dataIndex: "balanceAfter",
    key: "balance",
    width: 80,
    render: (v: number) => <Text strong>{v.toFixed(1)}</Text>,
    align: "right",
  },
  {
    title: "Notes",
    dataIndex: "notes",
    key: "notes",
    render: (v: string) => v ?? "–",
    ellipsis: true,
  },
];

const LedgerHistoryTable: React.FC<LedgerHistoryTableProps> = ({ entries, loading }) => {
  return (
    <Table
      dataSource={entries}
      columns={columns}
      rowKey="handle"
      loading={loading}
      size="small"
      pagination={{ pageSize: 20, showSizeChanger: false }}
      locale={{ emptyText: <Empty description="No ledger entries" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
    />
  );
};

export default LedgerHistoryTable;
