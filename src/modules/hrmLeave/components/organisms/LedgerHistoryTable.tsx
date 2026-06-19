"use client";

import React, { useState, useMemo } from "react";
import { Table, Empty, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import DirectionTag from "../atoms/DirectionTag";
import LeaveTypeTag from "../atoms/LeaveTypeTag";
import { LedgerHistoryTableProps } from "../../types/ui.types";
import { LedgerEntry } from "../../types/domain.types";
import { LEDGER_REF_TYPE_LABELS } from "../../utils/constants";
import { textSearchFilter, categoryFilter, dateRangeFilter } from "@/components/tableColumnFilters";

const { Text } = Typography;

const LedgerHistoryTable: React.FC<LedgerHistoryTableProps> = ({ entries, loading }) => {
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const columns: ColumnsType<LedgerEntry> = useMemo(
    () => [
      {
        title: "Date",
        dataIndex: "transactionDate",
        key: "date",
        width: 110,
        ...dateRangeFilter<LedgerEntry>('transactionDate'),
        render: (v: string) =>
          new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      },
      {
        title: "Type",
        dataIndex: "leaveTypeCode",
        key: "type",
        width: 80,
        ...categoryFilter<LedgerEntry>('leaveTypeCode', entries),
        render: (code: string) => <LeaveTypeTag code={code} />,
      },
      {
        title: "Ref",
        dataIndex: "refType",
        key: "refType",
        width: 120,
        ...categoryFilter<LedgerEntry>('refType', entries, {
          labelMap: LEDGER_REF_TYPE_LABELS,
          options: Object.entries(LEDGER_REF_TYPE_LABELS).map(([value, text]) => ({ text, value })),
        }),
        render: (v: string) => LEDGER_REF_TYPE_LABELS[v] ?? v,
      },
      {
        title: "Dir",
        dataIndex: "direction",
        key: "direction",
        width: 60,
        ...categoryFilter<LedgerEntry>('direction', entries, {
          options: [
            { text: 'Credit (CR)', value: 'CR' },
            { text: 'Debit (DR)', value: 'DR' },
          ],
        }),
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
        ...textSearchFilter<LedgerEntry>('notes'),
        render: (v: string) => v ?? "–",
        ellipsis: true,
      },
    ],
    [entries],
  );

  return (
    <Table
      dataSource={entries}
      columns={columns}
      rowKey="handle"
      loading={loading}
      size="small"
      scroll={{ x: "max-content" }}
      pagination={{
        current,
        pageSize,
        pageSizeOptions: ["10", "25", "50", "100"],
        showSizeChanger: true,
        showTotal: (total, range) =>
          total === 0 ? "0 records" : `${range[0]}–${range[1]} of ${total}`,
        onChange: (newPage, newSize) => {
          if (newSize !== pageSize) {
            setPageSize(newSize);
            setCurrent(1);
          } else {
            setCurrent(newPage);
          }
        },
      }}
      locale={{ emptyText: <Empty description="No ledger entries" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
    />
  );
};

export default LedgerHistoryTable;
