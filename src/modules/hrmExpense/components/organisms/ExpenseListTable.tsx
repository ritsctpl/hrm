"use client";

import React from "react";
import { Table, Empty, Button, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import type { ExpenseReport } from "../../types/domain.types";
import ExpenseStatusChip from "../atoms/ExpenseStatusChip";
import ExpenseTypeTag from "../atoms/ExpenseTypeTag";
import OutOfPolicyIcon from "../atoms/OutOfPolicyIcon";
import { formatExpenseDateRange } from "../../utils/expenseTransformations";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/ExpenseList.module.css";

interface Props {
  expenses: ExpenseReport[];
  loading: boolean;
  selectedHandle?: string;
  onRowClick: (expense: ExpenseReport) => void;
  onNewExpense?: () => void;
}

const ExpenseListTable: React.FC<Props> = ({
  expenses,
  loading,
  selectedHandle,
  onRowClick,
  onNewExpense,
}) => {
  const columns: ColumnsType<ExpenseReport> = [
    {
      title: "Report ID",
      dataIndex: "requestId",
      key: "requestId",
      width: 120,
      render: (id) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{id}</span>,
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
      ellipsis: true,
      render: (text) => <span style={{ fontSize: 13 }}>{text}</span>,
    },
    {
      title: "Type",
      key: "type",
      width: 130,
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
      width: 110,
      render: (_, r) => (
        <Tooltip title={r.currency !== "INR" ? `INR ${r.totalClaimedAmountInr?.toLocaleString()}` : undefined}>
          <span style={{ fontSize: 13 }}>
            {r.currency} {r.totalClaimedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Dates",
      key: "dates",
      width: 140,
      render: (_, r) => <span style={{ fontSize: 12 }}>{formatExpenseDateRange(r)}</span>,
    },
    {
      title: "Status",
      key: "status",
      width: 160,
      render: (_, r) => <ExpenseStatusChip status={r.status} size="sm" />,
    },
  ];

  return (
    <div className={styles.tableWrapper}>
      <Table
        rowKey="handle"
        columns={columns}
        dataSource={expenses}
        loading={loading}
        size="small"
        pagination={false}
        rowClassName={(r) =>
          `${styles.rowClickable} ${r.handle === selectedHandle ? styles.rowSelected : ""}`
        }
        onRow={(r) => ({ onClick: () => onRowClick(r) })}
        locale={{
          emptyText: (
            <Empty
              image={<ReceiptLongIcon style={{ fontSize: 48, color: "#d9d9d9" }} />}
              description="No expense reports yet"
            >
              {onNewExpense && (
                <Can I="add">
                  <Button type="primary" onClick={onNewExpense}>
                    + New Expense
                  </Button>
                </Can>
              )}
            </Empty>
          ),
        }}
      />
      <div className={styles.recordCount}>
        Showing {expenses.length} record{expenses.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

export default ExpenseListTable;
