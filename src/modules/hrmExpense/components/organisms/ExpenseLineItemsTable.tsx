"use client";

import React, { useState } from "react";
import { Table, Button, InputNumber, DatePicker, Select, Input, Typography, Popconfirm, Tooltip, Upload, Empty, message, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, DeleteOutlined, WarningOutlined, PaperClipOutlined, EditOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import type { ExpenseItem, ExpenseCategory } from "../../types/domain.types";
import type { LineItemError } from "../../utils/expenseValidations";
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
  justificationError?: string;
  lineErrors?: LineItemError[];
  onJustificationChange?: (val: string) => void;
  onAddItem?: (item: Partial<ExpenseItem>) => void;
  onUpdateItem?: (handle: string, changes: Partial<ExpenseItem>) => void;
  onRemoveItem?: (handle: string) => void;
  onUploadReceipt?: (lineIndex: number, file: File) => void;
}

const dateFormat = "DD/MM/YYYY";

interface NewItemRow {
  expenseDate: string | null;
  categoryId: string | null;
  description: string;
  amount: number | null;
  currency: string;
  attachmentRef: string | null;
}

const defaultNewRow: NewItemRow = {
  expenseDate: null,
  categoryId: null,
  description: "",
  amount: null,
  currency: "INR",
  attachmentRef: null,
};

const ExpenseLineItemsTable: React.FC<Props> = ({
  lineItems,
  categories,
  readonly,
  outOfPolicy,
  justification = "",
  justificationError,
  lineErrors = [],
  onJustificationChange,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onUploadReceipt,
}) => {
  const [newRow, setNewRow] = useState<NewItemRow>({ ...defaultNewRow });
  const [adding, setAdding] = useState(false);
  const [editingHandle, setEditingHandle] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<NewItemRow>({ ...defaultNewRow });

  const startEdit = (item: ExpenseItem) => {
    setEditingHandle(item.handle);
    setEditRow({
      expenseDate: item.expenseDate,
      categoryId: item.categoryId,
      description: item.description,
      amount: item.amount,
      currency: item.currency,
      attachmentRef: item.attachmentRef ?? null,
    });
  };

  const cancelEdit = () => {
    setEditingHandle(null);
    setEditRow({ ...defaultNewRow });
  };

  const saveEdit = (handle: string) => {
    if (!editRow.expenseDate) {
      message.warning("Please pick a date for the line item.");
      return;
    }
    if (!editRow.categoryId) {
      message.warning("Please select a category.");
      return;
    }
    if (!editRow.amount || editRow.amount <= 0) {
      message.warning("Amount must be greater than zero.");
      return;
    }
    const category = categories.find((c) => c.categoryCode === editRow.categoryId);
    onUpdateItem?.(handle, {
      expenseDate: editRow.expenseDate,
      categoryId: editRow.categoryId,
      categoryName: category?.categoryName ?? editRow.categoryId,
      description: editRow.description,
      amount: editRow.amount,
      currency: editRow.currency,
      attachmentRef: editRow.attachmentRef || undefined,
      outOfPolicy:
        (category?.dailyLimit != null && editRow.amount > category.dailyLimit) ||
        (category?.perTripLimit != null && editRow.amount > category.perTripLimit),
    });
    cancelEdit();
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const errorsByHandle = lineErrors.reduce<Record<string, LineItemError[]>>((acc, err) => {
    (acc[err.handle] ||= []).push(err);
    return acc;
  }, {});

  const columns: ColumnsType<ExpenseItem> = [
    {
      title: "Date",
      dataIndex: "expenseDate",
      width: 130,
      render: (d, r) =>
        editingHandle === r.handle ? (
          <DatePicker
            format={dateFormat}
            size="small"
            style={{ width: "100%" }}
            value={editRow.expenseDate ? dayjs(editRow.expenseDate) : null}
            onChange={(_, s) => setEditRow((p) => ({ ...p, expenseDate: (Array.isArray(s) ? s[0] : s) || null }))}
          />
        ) : (
          dayjs(d).format("DD MMM")
        ),
    },
    {
      title: "Category",
      dataIndex: "categoryName",
      width: 150,
      render: (v, r) =>
        editingHandle === r.handle ? (
          <Select
            size="small"
            style={{ width: "100%" }}
            value={editRow.categoryId}
            options={categories.map((c) => ({ value: c.categoryCode, label: c.categoryName }))}
            onChange={(val) => setEditRow((p) => ({ ...p, categoryId: val }))}
          />
        ) : (
          v ?? r.categoryId
        ),
    },
    {
      title: "Description",
      dataIndex: "description",
      ellipsis: true,
      render: (v, r) =>
        editingHandle === r.handle ? (
          <Input
            size="small"
            value={editRow.description}
            onChange={(e) => setEditRow((p) => ({ ...p, description: e.target.value }))}
          />
        ) : (
          v
        ),
    },
    {
      title: "Amount",
      key: "amount",
      width: 140,
      render: (_, r) => {
        if (editingHandle === r.handle) {
          return (
            <InputNumber
              size="small"
              min={0.01}
              step={0.01}
              style={{ width: "100%" }}
              value={editRow.amount ?? undefined}
              onChange={(v) => setEditRow((p) => ({ ...p, amount: v }))}
            />
          );
        }
        const rowErrors = errorsByHandle[r.handle] ?? [];
        const tip = rowErrors.map((e) => e.message).join("\n");
        return (
          <span>
            {r.currency} {r.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            {r.outOfPolicy && <OutOfPolicyIcon />}
            {rowErrors.length > 0 && (
              <Tooltip title={tip}>
                <WarningOutlined style={{ color: "#ff4d4f", marginLeft: 6 }} />
              </Tooltip>
            )}
          </span>
        );
      },
    },
    {
      title: "Receipt",
      key: "receipt",
      width: 110,
      render: (_, r, index) => (
        <ReceiptThumbnail
          attachmentId={r.attachmentRef}
          fileName={r.categoryName}
          onUpload={!readonly && onUploadReceipt ? (file) => onUploadReceipt(index, file) : undefined}
        />
      ),
    },
    !readonly && {
      title: "",
      key: "action",
      width: 90,
      render: (_, r) => {
        if (editingHandle === r.handle) {
          return (
            <Space size={4}>
              <Tooltip title="Save">
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined style={{ color: "#52c41a" }} />}
                  onClick={() => saveEdit(r.handle)}
                />
              </Tooltip>
              <Tooltip title="Cancel">
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={cancelEdit}
                />
              </Tooltip>
            </Space>
          );
        }
        return (
          <Space size={2}>
            {onUpdateItem && (
              <Can I="edit">
                <Tooltip title="Edit">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    disabled={!!editingHandle}
                    onClick={() => startEdit(r)}
                  />
                </Tooltip>
              </Can>
            )}
            <Can I="delete">
              <Popconfirm title="Remove item?" onConfirm={() => onRemoveItem?.(r.handle)}>
                <Button type="text" danger size="small" icon={<DeleteOutlined />} />
              </Popconfirm>
            </Can>
          </Space>
        );
      },
    },
  ].filter(Boolean) as ColumnsType<ExpenseItem>;

  const handleAddRow = () => {
    if (!newRow.expenseDate) {
      message.warning("Please pick a date for the line item.");
      return;
    }
    if (!newRow.categoryId) {
      message.warning("Please select a category.");
      return;
    }
    if (!newRow.amount || newRow.amount <= 0) {
      message.warning("Amount must be greater than zero.");
      return;
    }
    const category = categories.find((c) => c.categoryCode === newRow.categoryId);
    onAddItem?.({
      expenseDate: newRow.expenseDate,
      categoryId: newRow.categoryId,
      categoryName: category?.categoryName ?? newRow.categoryId,
      description: newRow.description,
      amount: newRow.amount,
      currency: newRow.currency,
      attachmentRef: newRow.attachmentRef || undefined,
      outOfPolicy:
        (category?.dailyLimit != null && newRow.amount > category.dailyLimit) ||
        (category?.perTripLimit != null && newRow.amount > category.perTripLimit),
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
        error={justificationError}
        onJustificationChange={onJustificationChange}
      />

      {!readonly && lineItems.length === 0 && (
        <div
          style={{
            padding: "6px 10px",
            marginBottom: 6,
            fontSize: 12,
            color: "#ad6800",
            background: "#fffbe6",
            border: "1px solid #ffe58f",
            borderRadius: 4,
          }}
        >
          At least one line item is required before you can submit.
        </div>
      )}

      <Table
        rowKey="handle"
        columns={columns}
        dataSource={lineItems}
        size="small"
        pagination={false}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              imageStyle={{ height: 32 }}
              description={<span style={{ color: "#bfbfbf", fontSize: 12 }}>No line items</span>}
              style={{ padding: "8px 0", margin: 0 }}
            />
          ),
        }}
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
                  min={0.01}
                  step={0.01}
                  style={{ width: 110 }}
                  value={newRow.amount ?? undefined}
                  onChange={(v) => setNewRow((p) => ({ ...p, amount: v }))}
                />
                <Upload
                  accept=".pdf,.jpg,.jpeg,.png"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    setNewRow((p) => ({ ...p, attachmentRef: file.name }));
                    return false;
                  }}
                >
                  <Button size="small" icon={<PaperClipOutlined />}>
                    {newRow.attachmentRef ?? "Receipt"}
                  </Button>
                </Upload>
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
