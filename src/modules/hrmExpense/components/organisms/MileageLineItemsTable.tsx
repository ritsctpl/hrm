"use client";

import React, { useState } from "react";
import { Table, Button, InputNumber, DatePicker, Input, Typography, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { MileageLineItem } from "../../types/domain.types";
import { useMileageCalculator } from "../../hooks/useMileageCalculator";
import dayjs from "dayjs";

const { Text } = Typography;
const dateFormat = "DD/MM/YYYY";

interface Props {
  mileageItems: MileageLineItem[];
  ratePerKm?: number;
  readonly?: boolean;
  onAddItem?: (item: Omit<MileageLineItem, "lineItemId">) => void;
  onRemoveItem?: (lineItemId: string) => void;
}

interface NewMileageRow {
  tripDate: string | null;
  fromLocation: string;
  toLocation: string;
  distanceKm: number | null;
}

const defaultNewRow: NewMileageRow = {
  tripDate: null,
  fromLocation: "",
  toLocation: "",
  distanceKm: null,
};

const MileageLineItemsTable: React.FC<Props> = ({
  mileageItems,
  ratePerKm = 10,
  readonly,
  onAddItem,
  onRemoveItem,
}) => {
  const [newRow, setNewRow] = useState<NewMileageRow>({ ...defaultNewRow });
  const [adding, setAdding] = useState(false);
  const { calculateAmount, calculating } = useMileageCalculator();

  const totalAmount = mileageItems.reduce((sum, item) => sum + item.amount, 0);

  const columns: ColumnsType<MileageLineItem> = [
    {
      title: "Date",
      dataIndex: "tripDate",
      width: 90,
      render: (d) => dayjs(d).format("DD MMM"),
    },
    {
      title: "From",
      dataIndex: "fromLocation",
      ellipsis: true,
    },
    {
      title: "To",
      dataIndex: "toLocation",
      ellipsis: true,
    },
    {
      title: "KM",
      dataIndex: "distanceKm",
      width: 70,
      render: (v) => v.toFixed(1),
    },
    {
      title: "Rate/KM",
      dataIndex: "ratePerKm",
      width: 80,
      render: (v) => v.toFixed(2),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      width: 90,
      render: (v) => v.toFixed(2),
    },
    !readonly && {
      title: "",
      key: "action",
      width: 40,
      render: (_, r) => (
        <Popconfirm title="Remove entry?" onConfirm={() => onRemoveItem?.(r.lineItemId)}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ].filter(Boolean) as ColumnsType<MileageLineItem>;

  const handleAddRow = async () => {
    if (!newRow.tripDate || !newRow.fromLocation || !newRow.toLocation || !newRow.distanceKm) return;
    const result = await calculateAmount(newRow.distanceKm);
    const rate = result?.ratePerKm ?? ratePerKm;
    const amount = result?.amount ?? newRow.distanceKm * rate;
    onAddItem?.({
      tripDate: newRow.tripDate,
      fromLocation: newRow.fromLocation,
      toLocation: newRow.toLocation,
      distanceKm: newRow.distanceKm,
      ratePerKm: rate,
      amount,
    });
    setNewRow({ ...defaultNewRow });
    setAdding(false);
  };

  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
        Rate per KM: {ratePerKm.toFixed(2)} (configured by admin — auto-applied)
      </Text>
      <Table
        rowKey="lineItemId"
        columns={columns}
        dataSource={mileageItems}
        size="small"
        pagination={false}
        footer={() => (
          <div>
            {!readonly && !adding && (
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => setAdding(true)}>
                Add Mileage Entry
              </Button>
            )}
            {!readonly && adding && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                <DatePicker
                  format={dateFormat}
                  placeholder="Date"
                  style={{ width: 110 }}
                  onChange={(_, s) => setNewRow((p) => ({ ...p, tripDate: (Array.isArray(s) ? s[0] : s) || null }))}
                />
                <Input
                  placeholder="From location"
                  style={{ width: 150 }}
                  value={newRow.fromLocation}
                  onChange={(e) => setNewRow((p) => ({ ...p, fromLocation: e.target.value }))}
                />
                <Input
                  placeholder="To location"
                  style={{ width: 150 }}
                  value={newRow.toLocation}
                  onChange={(e) => setNewRow((p) => ({ ...p, toLocation: e.target.value }))}
                />
                <InputNumber
                  placeholder="KM"
                  min={0}
                  step={0.1}
                  style={{ width: 80 }}
                  value={newRow.distanceKm ?? undefined}
                  onChange={(v) => setNewRow((p) => ({ ...p, distanceKm: v }))}
                />
                <Button type="primary" size="small" loading={calculating} onClick={handleAddRow}>Add</Button>
                <Button size="small" onClick={() => { setAdding(false); setNewRow({ ...defaultNewRow }); }}>Cancel</Button>
              </div>
            )}
          </div>
        )}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 0", borderTop: "2px solid #f0f0f0", marginTop: 4 }}>
        <Text strong>Total Claimed: INR {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
      </div>
    </div>
  );
};

export default MileageLineItemsTable;
