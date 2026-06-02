"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  InputNumber,
  DatePicker,
  Input,
  Select,
  Typography,
  Popconfirm,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ExpenseItem, MileageRateConfig } from "../../types/domain.types";
import { useMileageCalculator } from "../../hooks/useMileageCalculator";
import { HrmExpenseService } from "../../services/hrmExpenseService";
import { getOrganizationId } from "@/utils/cookieUtils";
import Can from "../../../hrmAccess/components/Can";
import dayjs from "dayjs";
// Side-effect import: extends dayjs with the plugins AntD DatePicker needs
// for calendar cell rendering.
import "../../utils/dateHelpers";

const { Text } = Typography;
const dateFormat = "DD/MM/YYYY";

// Fallback used when the backend mileage-rate-config endpoint is not yet
// available. Matches the defaults documented in the backend prompt §2.
const FALLBACK_CONFIG: MileageRateConfig = {
  organizationId: "",
  currentPetrolPriceInr: 100,
  vehicles: [
    { mode: "CAR", label: "Car", kmPerLitre: 12 },
    { mode: "BIKE", label: "Bike / Two-wheeler", kmPerLitre: 40 },
  ],
};

interface Props {
  mileageItems: ExpenseItem[];
  ratePerKm?: number;
  readonly?: boolean;
  headerFromDate?: string | null;
  headerToDate?: string | null;
  onAddItem?: (item: Partial<ExpenseItem>) => void;
  onRemoveItem?: (handle: string) => void;
}

interface NewMileageRow {
  tripDate: string | null;
  mode: string | null;
  fromLocation: string;
  toLocation: string;
  distanceKm: number | null;
}

const defaultNewRow: NewMileageRow = {
  tripDate: null,
  mode: null,
  fromLocation: "",
  toLocation: "",
  distanceKm: null,
};

const MileageLineItemsTable: React.FC<Props> = ({
  mileageItems,
  ratePerKm = 10,
  readonly,
  headerFromDate,
  headerToDate,
  onAddItem,
  onRemoveItem,
}) => {
  const organizationId = getOrganizationId();
  const [newRow, setNewRow] = useState<NewMileageRow>({ ...defaultNewRow });
  const [adding, setAdding] = useState(false);
  const { calculateAmount, calculating } = useMileageCalculator();

  // Petrol-price-driven config. Loaded once on mount. Endpoint may not exist
  // yet — we fall back silently and the picker just defaults to Car @ 12 km/L.
  const [rateConfig, setRateConfig] = useState<MileageRateConfig>(FALLBACK_CONFIG);
  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    HrmExpenseService.getMileageRateConfig({ organizationId })
      .then((cfg) => {
        if (!cancelled && cfg && cfg.vehicles?.length) setRateConfig(cfg);
      })
      .catch(() => {
        // Endpoint not ready — keep fallback. No user-visible error.
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const modeOptions = rateConfig.vehicles.map((v) => ({ value: v.mode, label: v.label }));
  const selectedVehicle = rateConfig.vehicles.find((v) => v.mode === newRow.mode);
  const derivedRate = selectedVehicle
    ? Number((rateConfig.currentPetrolPriceInr / selectedVehicle.kmPerLitre).toFixed(2))
    : ratePerKm;

  const totalAmount = mileageItems.reduce(
    (sum, item) => sum + (item.mileageAmount ?? item.amount ?? 0),
    0,
  );

  const minBound = headerFromDate
    ? (() => {
        const d = dayjs(headerFromDate, dateFormat, true);
        return d.isValid() ? d.startOf("day") : null;
      })()
    : null;
  const maxBound = headerToDate
    ? (() => {
        const d = dayjs(headerToDate, dateFormat, true);
        return d.isValid() ? d.endOf("day") : null;
      })()
    : null;

  const isDateDisabled = (current: dayjs.Dayjs | null) => {
    if (!current) return false;
    if (minBound && current.isBefore(minBound, "day")) return true;
    if (maxBound && current.isAfter(maxBound, "day")) return true;
    return false;
  };

  const dateBoundHint =
    minBound && maxBound && minBound.isSame(maxBound, "day")
      ? `Must be ${minBound.format(dateFormat)}`
      : minBound && maxBound
        ? `Between ${minBound.format(dateFormat)} and ${maxBound.format(dateFormat)}`
        : minBound
          ? `On or after ${minBound.format(dateFormat)}`
          : maxBound
            ? `On or before ${maxBound.format(dateFormat)}`
            : null;

  const columns: ColumnsType<ExpenseItem> = [
    {
      title: "Date",
      dataIndex: "expenseDate",
      width: 90,
      render: (d) => dayjs(d).format("DD MMM"),
    },
    {
      title: "Mode",
      dataIndex: "mode",
      width: 80,
      render: (v) => {
        const label = rateConfig.vehicles.find((x) => x.mode === v)?.label;
        return label ?? v ?? "—";
      },
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
      render: (v) => v?.toFixed(1) ?? "—",
    },
    {
      title: "Rate/KM",
      dataIndex: "ratePerKm",
      width: 80,
      render: (v) => v?.toFixed(2) ?? "—",
    },
    {
      title: "Amount",
      key: "amount",
      width: 90,
      render: (_, r) => (r.mileageAmount ?? r.amount)?.toFixed(2) ?? "—",
    },
    !readonly && {
      title: "",
      key: "action",
      width: 40,
      render: (_, r) => (
        <Can I="delete">
          <Popconfirm title="Remove entry?" onConfirm={() => onRemoveItem?.(r.handle)}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Can>
      ),
    },
  ].filter(Boolean) as ColumnsType<ExpenseItem>;

  const handleAddRow = async () => {
    if (
      !newRow.tripDate ||
      !newRow.mode ||
      !newRow.fromLocation ||
      !newRow.toLocation ||
      !newRow.distanceKm
    )
      return;

    // Derive rate live from petrol price ÷ vehicle efficiency. Snapshotted
    // onto the line so historical entries stay stable when petrol price changes.
    const calc = await calculateAmount(newRow.distanceKm);
    const rate = derivedRate || calc?.ratePerKm || ratePerKm;
    const amount = Number((newRow.distanceKm * rate).toFixed(2));

    onAddItem?.({
      expenseDate: newRow.tripDate,
      mode: newRow.mode,
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
        Petrol: ₹{rateConfig.currentPetrolPriceInr.toFixed(2)} • Pick a mode below — rate is
        auto-calculated from petrol price ÷ vehicle efficiency.
      </Text>
      <Table
        rowKey="handle"
        columns={columns}
        dataSource={mileageItems}
        size="small"
        pagination={false}
        footer={() => (
          <div>
            {!readonly && !adding && (
              <Can I="add">
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => setAdding(true)}>
                  Add Trip
                </Button>
              </Can>
            )}
            {!readonly && adding && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                <Tooltip title={dateBoundHint || undefined}>
                  <DatePicker
                    format={dateFormat}
                    placeholder="Date"
                    style={{ width: 110 }}
                    value={newRow.tripDate ? dayjs(newRow.tripDate, dateFormat) : null}
                    disabledDate={isDateDisabled}
                    onChange={(_, s) =>
                      setNewRow((p) => ({
                        ...p,
                        tripDate: (Array.isArray(s) ? s[0] : s) || null,
                      }))
                    }
                  />
                </Tooltip>
                <Select
                  placeholder="Mode"
                  style={{ width: 130 }}
                  value={newRow.mode ?? undefined}
                  options={modeOptions}
                  onChange={(v) => setNewRow((p) => ({ ...p, mode: v }))}
                />
                <Input
                  placeholder="From"
                  style={{ width: 130 }}
                  value={newRow.fromLocation}
                  onChange={(e) =>
                    setNewRow((p) => ({ ...p, fromLocation: e.target.value }))
                  }
                />
                <Input
                  placeholder="To"
                  style={{ width: 130 }}
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
                {selectedVehicle && (
                  <Text type="secondary" style={{ fontSize: 12, marginBottom: 4 }}>
                    @ ₹{derivedRate.toFixed(2)}/km
                    {newRow.distanceKm
                      ? ` → ₹${(newRow.distanceKm * derivedRate).toFixed(2)}`
                      : ""}
                  </Text>
                )}
                <Button
                  type="primary"
                  size="small"
                  loading={calculating}
                  onClick={handleAddRow}
                  disabled={!newRow.mode}
                >
                  Add
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setAdding(false);
                    setNewRow({ ...defaultNewRow });
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "8px 0",
          borderTop: "2px solid #f0f0f0",
          marginTop: 4,
        }}
      >
        <Text strong>
          Total Claimed: INR{" "}
          {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </Text>
      </div>
    </div>
  );
};

export default MileageLineItemsTable;
