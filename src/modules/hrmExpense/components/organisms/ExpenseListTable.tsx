"use client";

import React from "react";
import { Empty, Button, Tooltip, Tag, Spin, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { ExpenseReport } from "../../types/domain.types";
import ExpenseStatusChip from "../atoms/ExpenseStatusChip";
import OutOfPolicyIcon from "../atoms/OutOfPolicyIcon";
import { formatExpenseDateRange } from "../../utils/expenseTransformations";
import { EXPENSE_TYPE_LABELS } from "../../utils/expenseConstants";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/ExpenseList.module.css";

interface Props {
  expenses: ExpenseReport[];
  loading: boolean;
  selectedHandle?: string;
  onRowClick: (expense: ExpenseReport) => void;
  onNewExpense?: () => void;
  /**
   * When provided, draft rows show an inline delete icon. The handler is
   * fired only after the user confirms the popconfirm.
   */
  onDeleteDraft?: (expense: ExpenseReport) => void;
}

const ExpenseListTable: React.FC<Props> = ({
  expenses,
  loading,
  selectedHandle,
  onRowClick,
  onNewExpense,
  onDeleteDraft,
}) => {
  if (loading && expenses.length === 0) {
    return (
      <div className={styles.tableWrapper} style={{ textAlign: "center", padding: "32px 0" }}>
        <Spin />
      </div>
    );
  }

  if (!loading && expenses.length === 0) {
    return (
      <div className={styles.tableWrapper}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          imageStyle={{ height: 40 }}
          description={
            <span style={{ color: "#8c8c8c", fontSize: 13 }}>No expense reports yet</span>
          }
          style={{ padding: "32px 0" }}
        >
          {onNewExpense && (
            <Can I="add">
              <Button type="primary" size="small" onClick={onNewExpense}>
                + New Expense
              </Button>
            </Can>
          )}
        </Empty>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.cardList}>
        {expenses.map((r) => {
          const isSelected = r.handle === selectedHandle;
          return (
            <div
              key={r.handle}
              className={`${styles.expenseCard} ${isSelected ? styles.expenseCardSelected : ""}`}
              onClick={() => onRowClick(r)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRowClick(r);
                }
              }}
            >
              <div className={styles.cardTopRow}>
                <span className={styles.cardReportId}>{r.requestId}</span>
                <span className={styles.cardAmount}>
                  <Tooltip
                    title={
                      r.currency !== "INR"
                        ? `INR ${r.totalClaimedAmountInr?.toLocaleString()}`
                        : undefined
                    }
                  >
                    {r.currency}{" "}
                    {r.totalClaimedAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </Tooltip>
                </span>
                <ExpenseStatusChip status={r.status} size="sm" bucketed />
                {onDeleteDraft && r.status === "DRAFT" && (
                  <Can I="delete" object="expense_record">
                    <Popconfirm
                      title="Delete this draft?"
                      description={`${r.requestId} will be removed.`}
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        onDeleteDraft(r);
                      }}
                      onCancel={(e) => e?.stopPropagation()}
                    >
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Delete draft"
                      />
                    </Popconfirm>
                  </Can>
                )}
              </div>
              <div className={styles.cardTitle}>{r.purpose || "Untitled expense"}</div>
              <div className={styles.cardMeta}>
                <span>{formatExpenseDateRange(r)}</span>
                <span className={styles.cardMetaSep}>•</span>
                <span>{EXPENSE_TYPE_LABELS[r.expenseType] ?? r.expenseType}</span>
                {r.outOfPolicy && (
                  <>
                    <span className={styles.cardMetaSep}>•</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                      <OutOfPolicyIcon /> Over policy
                    </span>
                  </>
                )}
                {r.lateSubmission && (
                  <>
                    <span className={styles.cardMetaSep}>•</span>
                    <Tooltip title="Submitted after the policy deadline">
                      <Tag color="red" style={{ marginLeft: 0 }}>
                        Late
                      </Tag>
                    </Tooltip>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.recordCount}>
        Showing {expenses.length} record{expenses.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

export default ExpenseListTable;
