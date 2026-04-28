"use client";

import React from "react";
import { Table, Empty, Tag, Tooltip } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { ExpenseReport } from "../../types/domain.types";
import ExpenseTypeTag from "../atoms/ExpenseTypeTag";
import OutOfPolicyIcon from "../atoms/OutOfPolicyIcon";
import { computeExpenseSlaInfo } from "../../utils/expenseTransformations";
import styles from "../../styles/ExpenseList.module.css";
import dayjs from "dayjs";

interface Props {
  expenses: ExpenseReport[];
  loading: boolean;
  selectedHandle?: string;
  onRowClick: (expense: ExpenseReport) => void;
}

const SupervisorInboxTable: React.FC<Props> = ({ expenses, loading, selectedHandle, onRowClick }) => {
  const columns: ColumnsType<ExpenseReport> = [
    {
      title: "Report ID",
      dataIndex: "requestId",
      width: 110,
      render: (id) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{id}</span>,
    },
    {
      title: "Employee",
      dataIndex: "employeeName",
      render: (n) => <span style={{ fontSize: 13 }}>{n}</span>,
    },
    {
      title: "Type",
      key: "type",
      width: 180,
      render: (_, r) => (
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <ExpenseTypeTag expenseType={r.expenseType} />
          {r.outOfPolicy && <OutOfPolicyIcon />}
          {r.lateSubmission && (
            <Tooltip title="Submitted after the policy deadline">
              <Tag color="red" style={{ marginLeft: 4 }}>
                Late
              </Tag>
            </Tooltip>
          )}
          {r.escalationLevel != null && r.escalationLevel > 0 && (
            <Tooltip title={`Escalated to level ${r.escalationLevel}`}>
              <Tag color="volcano" style={{ marginLeft: 4 }}>
                L{r.escalationLevel}
              </Tag>
            </Tooltip>
          )}
        </span>
      ),
    },
    {
      title: "Amount",
      key: "amount",
      width: 100,
      render: (_, r) => <span style={{ fontSize: 13 }}>{r.totalClaimedAmount.toLocaleString()}</span>,
    },
    {
      title: "Submitted",
      key: "submitted",
      width: 100,
      render: (_, r) => (
        <span style={{ fontSize: 12 }}>
          {r.submittedAt ? dayjs(r.submittedAt).format("DD MMM") : "—"}
        </span>
      ),
    },
    {
      title: "SLA",
      key: "sla",
      width: 130,
      render: (_, r) => {
        const sla = computeExpenseSlaInfo(r);
        if (!sla.label) return null;
        const tip = r.slaDeadline
          ? `Due by ${dayjs(r.slaDeadline).format("DD MMM YYYY, hh:mm A")}`
          : sla.label;
        return (
          <Tooltip title={tip}>
            <Tag
              icon={<ClockCircleOutlined />}
              color={sla.isOverdue ? "error" : sla.color === "warning" ? "warning" : "success"}
            >
              {sla.label}
            </Tag>
          </Tooltip>
        );
      },
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
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              imageStyle={{ height: 40 }}
              description={<span style={{ color: "#8c8c8c", fontSize: 13 }}>No requests in this inbox.</span>}
              style={{ padding: "16px 0" }}
            />
          ),
        }}
      />
      <div className={styles.recordCount}>Showing {expenses.length} record{expenses.length !== 1 ? "s" : ""}</div>
    </div>
  );
};

export default SupervisorInboxTable;
