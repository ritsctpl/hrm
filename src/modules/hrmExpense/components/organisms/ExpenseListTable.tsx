"use client";

import React, { useMemo } from "react";
import { Empty, Button, Tooltip, Tag, Spin, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { ExpenseReport } from "../../types/domain.types";
import ExpenseStatusChip from "../atoms/ExpenseStatusChip";
import OutOfPolicyIcon from "../atoms/OutOfPolicyIcon";
import { formatExpenseDateRange } from "../../utils/expenseTransformations";
import { parseFlexibleDate } from "../../utils/dateHelpers";
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
  /**
   * Filter inputs from the search bar. Filtering is applied client-side here
   * (the landing fetches the full list once), so the controls work uniformly
   * and instantly without depending on server-side filter support.
   * dateRange is [from, to] in DD/MM/YYYY (the picker's display format).
   */
  searchTerm?: string;
  statusFilter?: string | null;
  typeFilter?: string | null;
  dateRange?: [string, string] | null;
}

const ExpenseListTable: React.FC<Props> = ({
  expenses,
  loading,
  selectedHandle,
  onRowClick,
  onNewExpense,
  onDeleteDraft,
  searchTerm = "",
  statusFilter = null,
  typeFilter = null,
  dateRange = null,
}) => {
  // All filtering happens client-side against the full list the store holds.
  // Mirrors TravelListTable so the "My Expenses" filters behave like every
  // other screen. An expense matches the date range when ANY of its line
  // items falls within [from, to].
  const filteredExpenses = useMemo(() => {
    let rows = expenses;

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      rows = rows.filter(
        (r) =>
          r.requestId?.toLowerCase().includes(term) ||
          r.purpose?.toLowerCase().includes(term),
      );
    }

    if (statusFilter) {
      rows = rows.filter((r) => r.status === statusFilter);
    }

    if (typeFilter) {
      rows = rows.filter((r) => r.expenseType === typeFilter);
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const from = parseFlexibleDate(dateRange[0])?.startOf("day");
      const to = parseFlexibleDate(dateRange[1])?.endOf("day");
      if (from && to) {
        rows = rows.filter((r) =>
          (r.items ?? []).some((item) => {
            const d = parseFlexibleDate(item.expenseDate);
            return d && !d.isBefore(from) && !d.isAfter(to);
          }),
        );
      }
    }

    return rows;
  }, [expenses, searchTerm, statusFilter, typeFilter, dateRange]);

  if (loading && filteredExpenses.length === 0) {
    return (
      <div className={styles.tableWrapper} style={{ textAlign: "center", padding: "32px 0" }}>
        <Spin />
      </div>
    );
  }

  if (!loading && filteredExpenses.length === 0) {
    // Distinguish "no expenses at all" (offer the create CTA) from "filters
    // excluded everything" (the list has rows, just none match).
    const noneAtAll = expenses.length === 0;
    return (
      <div className={styles.tableWrapper}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          imageStyle={{ height: 40 }}
          description={
            <span style={{ color: "#8c8c8c", fontSize: 13 }}>
              {noneAtAll ? "No expense reports yet" : "No expense reports match your filters"}
            </span>
          }
          style={{ padding: "32px 0" }}
        >
          {noneAtAll && onNewExpense && (
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
        {filteredExpenses.map((r) => {
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
        Showing {filteredExpenses.length} record{filteredExpenses.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

export default ExpenseListTable;
