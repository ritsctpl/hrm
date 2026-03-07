"use client";

import React, { useState } from "react";
import { Table, Button, InputNumber, DatePicker, Select, Input, Typography, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ExpenseLineItem, ExpenseCategory } from "../../types/domain.types";
import ReceiptThumbnail from "../molecules/ReceiptThumbnail";
import OutOfPolicyIcon from "../atoms/OutOfPolicyIcon";
import OutOfPolicyBanner from "../molecules/OutOfPolicyBanner";
import styles from "../../styles/ExpenseLineItems.module.css";
import dayjs from "dayjs";

const { Text } = Typography;

interface Props {
  lineItems: ExpenseLineItem[];
  categories: ExpenseCategory[];
  readonly?: boolean;
  outOfPolicy?: boolean;
  justification?: string;
  onJustificationChange?: (val: string) => void;
  onAddItem?: (item: Omit<ExpenseLineItem, "lineItemId" | "amountInr">) => void;
  onRemoveItem?: (lineItemId: string) => void;
}

const dateFormat = "DD/MM/YYYY";

interface NewItemRow {
  expenseDate: string | null;
  categoryCode: string | null;
  description: string;
  amount: number | null;
  currency: string;
}

const defaultNewRow: NewItemRow = {
  expenseDate: null,
  categoryCode: null,
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

  const columns: ColumnsType<ExpenseLineItem> = [
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
      render: (_, r) => <ReceiptThumbnail attachmentId={r.receiptAttachmentId} fileName={r.categoryName} />,
    },
    !readonly && {
      title: "",
      key: "action",
      width: 40,
      render: (_, r) => (
        <Popconfirm title="Remove item?" onConfirm={() => onRemoveItem?.(r.lineItemId)}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ].filter(Boolean) as ColumnsType<ExpenseLineItem>;

  const handleAddRow = () => {
    if (!newRow.expenseDate || !newRow.categoryCode || !newRow.amount) return;
    const category = categories.find((c) => c.code === newRow.categoryCode);
    onAddItem?.({
      expenseDate: newRow.expenseDate,
      categoryCode: newRow.categoryCode,
      categoryName: category?.name ?? newRow.categoryCode,
      description: newRow.description,
      amount: newRow.amount,
      currency: newRow.currency,
      outOfPolicy: category?.dailyLimitInr != null && newRow.amount > category.dailyLimitInr,
      policyLimit: category?.dailyLimitInr,
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
        rowKey="lineItemId"
        columns={columns}
        dataSource={lineItems}
        size="small"
        pagination={false}
        footer={() => (
          <div className={styles.addRowButton}>
            {!readonly && !adding && (
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => setAdding(true)}
              >
                Add Line Item
              </Button>
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
                  options={categories.map((c) => ({ value: c.code, label: c.name }))}
                  onChange={(v) => setNewRow((p) => ({ ...p, categoryCode: v }))}
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
