"use client";

import React, { useState } from "react";
import { Table, Button, InputNumber, DatePicker, Select, Input, Typography, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ExpenseItem, ExpenseCategory } from "../../types/domain.types";
import ReceiptThumbnail from "../molecules/ReceiptThumbnail";
import OutOfPolicyIcon from "../atoms/OutOfPolicyIcon";
import OutOfPolicyBanner from "../molecules/OutOfPolicyBanner";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/ExpenseLineItems.module.css";
import dayjs from "dayjs";

const { Text } = Typography;

interface Props {
  lineItems: ExpenseItem[];
  categories: ExpenseCategory[];
  readonly?: boolean;
  outOfPolicy?: boolean;
  justification?: string;
  onJustificationChange?: (val: string) => void;
  onAddItem?: (item: Partial<ExpenseItem>) => void;
  onRemoveItem?: (handle: string) => void;
}

const dateFormat = "DD/MM/YYYY";

interface NewItemRow {
  expenseDate: string | null;
  categoryId: string | null;
  description: string;
  amount: number | null;
  currency: string;
}

const defaultNewRow: NewItemRow = {
  expenseDate: null,
  categoryId: null,
  description: "",
  amount: null,
  currency: "INR",
};

const ExpenseLineItemsTable: React.FC<Props> = ({
  lineItems,
  categories,
  readonly,
  outOfPolicy,
  justification = "",
  onJustificationChange,
  onAddItem,
  onRemoveItem,
}) => {
  const [newRow, setNewRow] = useState<NewItemRow>({ ...defaultNewRow });
  const [adding, setAdding] = useState(false);

  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

  const columns: ColumnsType<ExpenseItem> = [
    {
      title: "Date",
      dataIndex: "expenseDate",
      width: 100,
      render: (d) => dayjs(d).format("DD MMM"),
    },
    {
      title: "Category",
      dataIndex: "categoryName",
      width: 120,
      render: (v, r) => v ?? r.categoryId,
    },
    {
      title: "Description",
      dataIndex: "description",
      ellipsis: true,
    },
    {
      title: "Amount",
      key: "amount",
      width: 110,
      render: (_, r) => (
        <span>
          {r.currency} {r.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          {r.outOfPolicy && <OutOfPolicyIcon />}
        </span>
      ),
    },
    {
      title: "Receipt",
      key: "receipt",
      width: 80,
      render: (_, r) => <ReceiptThumbnail attachmentId={r.attachmentRef} fileName={r.categoryName} />,
    },
    !readonly && {
      title: "",
      key: "action",
      width: 40,
      render: (_, r) => (
        <Can I="delete">
          <Popconfirm title="Remove item?" onConfirm={() => onRemoveItem?.(r.handle)}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Can>
      ),
    },
  ].filter(Boolean) as ColumnsType<ExpenseItem>;

  const handleAddRow = () => {
    if (!newRow.expenseDate || !newRow.categoryId || !newRow.amount) return;
    const category = categories.find((c) => c.categoryCode === newRow.categoryId);
    onAddItem?.({
      expenseDate: newRow.expenseDate,
      categoryId: newRow.categoryId,
      categoryName: category?.categoryName ?? newRow.categoryId,
      description: newRow.description,
      amount: newRow.amount,
      currency: newRow.currency,
      outOfPolicy: category?.dailyLimit != null && newRow.amount > category.dailyLimit,
    });
    setNewRow({ ...defaultNewRow });
    setAdding(false);
  };

  return (
    <div>
      <OutOfPolicyBanner
        show={!!outOfPolicy}
        justification={justification}
        readonly={readonly}
        onJustificationChange={onJustificationChange}
      />

      <Table
        rowKey="handle"
        columns={columns}
        dataSource={lineItems}
        size="small"
        pagination={false}
        footer={() => (
          <div className={styles.addRowButton}>
            {!readonly && !adding && (
              <Can I="add">
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => setAdding(true)}
                >
                  Add Line Item
                </Button>
              </Can>
            )}
            {!readonly && adding && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                <DatePicker
                  format={dateFormat}
                  placeholder="Date"
                  style={{ width: 120 }}
                  onChange={(_, s) => setNewRow((p) => ({ ...p, expenseDate: (Array.isArray(s) ? s[0] : s) || null }))}
                />
                <Select
                  placeholder="Category"
                  style={{ width: 140 }}
                  options={categories.map((c) => ({ value: c.categoryCode, label: c.categoryName }))}
                  onChange={(v) => setNewRow((p) => ({ ...p, categoryId: v }))}
                />
                <Input
                  placeholder="Description"
                  style={{ width: 160 }}
                  value={newRow.description}
                  onChange={(e) => setNewRow((p) => ({ ...p, description: e.target.value }))}
                />
                <InputNumber
                  placeholder="Amount"
                  min={0}
                  style={{ width: 110 }}
                  value={newRow.amount ?? undefined}
                  onChange={(v) => setNewRow((p) => ({ ...p, amount: v }))}
                />
                <Button type="primary" size="small" onClick={handleAddRow}>Add</Button>
                <Button size="small" onClick={() => { setAdding(false); setNewRow({ ...defaultNewRow }); }}>Cancel</Button>
              </div>
            )}
          </div>
        )}
      />

      <div className={styles.addRowButton} style={{ display: "flex", justifyContent: "flex-end", padding: "8px 0", borderTop: "2px solid #f0f0f0", marginTop: 4 }}>
        <Text strong>
          Total Claimed: {lineItems[0]?.currency ?? "INR"}{" "}
          {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </Text>
      </div>
    </div>
  );
};

export default ExpenseLineItemsTable;
