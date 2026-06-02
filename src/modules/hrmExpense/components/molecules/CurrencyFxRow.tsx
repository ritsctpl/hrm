"use client";

import React, { useState } from "react";
import { Form, Select, InputNumber, Typography, Button, Space } from "antd";

const { Text } = Typography;

const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "AED", label: "AED" },
  { value: "SGD", label: "SGD" },
];

interface Props {
  currency: string;
  exchangeRate: number;
  readonly?: boolean;
  onCurrencyChange?: (currency: string) => void;
  onRateChange?: (rate: number) => void;
}

const CurrencyFxRow: React.FC<Props> = ({
  currency,
  exchangeRate,
  readonly,
  onCurrencyChange,
  onRateChange,
}) => {
  const nonInr = currency !== "INR";
  const [expanded, setExpanded] = useState(nonInr);

  // Keep expanded state in sync when currency changes externally (e.g. loading a draft).
  React.useEffect(() => {
    if (nonInr && !expanded) setExpanded(true);
  }, [nonInr, expanded]);

  if (!expanded) {
    return (
      <Space size={6} style={{ marginTop: 4 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Currency: INR
        </Text>
        {!readonly && (
          <Button
            type="link"
            size="small"
            style={{ padding: 0, fontSize: 12 }}
            onClick={() => setExpanded(true)}
          >
            Different currency?
          </Button>
        )}
      </Space>
    );
  }

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
      <Form.Item label="Currency" style={{ flex: 1 }}>
        <Select
          value={currency}
          options={CURRENCY_OPTIONS}
          onChange={(c) => {
            onCurrencyChange?.(c);
            if (c === "INR") setExpanded(false);
          }}
          disabled={readonly}
          style={{ width: "100%" }}
        />
      </Form.Item>
      <Form.Item
        label={currency === "INR" ? "Exchange Rate" : `Exchange Rate (${currency} → INR)`}
        style={{ flex: 1 }}
      >
        <InputNumber
          value={exchangeRate}
          min={0.0001}
          step={0.0001}
          precision={4}
          disabled={readonly || currency === "INR"}
          onChange={(v) => onRateChange?.(v ?? 1)}
          style={{ width: "100%" }}
        />
      </Form.Item>
      {currency !== "INR" && (
        <Text type="secondary" style={{ marginBottom: 24, fontSize: 12 }}>
          Auto from RBI; Finance edits
        </Text>
      )}
    </div>
  );
};

export default CurrencyFxRow;
