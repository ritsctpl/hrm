"use client";

import React from "react";
import { Form, Input, Radio, DatePicker, Select } from "antd";
import type { ExpenseFormState } from "../../types/ui.types";
import CurrencyFxRow from "../molecules/CurrencyFxRow";
import styles from "../../styles/ExpenseForm.module.css";
import dayjs from "dayjs";

interface Props {
  formState: ExpenseFormState;
  onChange: (changes: Partial<ExpenseFormState>) => void;
  readonly?: boolean;
}

const dateFormat = "DD/MM/YYYY";

const ExpenseHeaderForm: React.FC<Props> = ({ formState, onChange, readonly }) => {
  return (
    <Form layout="vertical" component="div">
      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Expense Type</div>
        <Radio.Group
          value={formState.expenseType}
          onChange={(e) => onChange({ expenseType: e.target.value })}
          disabled={readonly}
        >
          <Radio value="ADVANCE">Advance</Radio>
          <Radio value="REIMBURSEMENT">Reimbursement</Radio>
          <Radio value="MILEAGE">Mileage</Radio>
        </Radio.Group>
      </div>

      <div className={styles.formSection}>
        <Form.Item label="Purpose" required>
          <Input.TextArea
            placeholder="Describe the purpose of this expense"
            rows={3}
            value={formState.purpose}
            onChange={(e) => onChange({ purpose: e.target.value })}
            disabled={readonly}
          />
        </Form.Item>

        <Form.Item label="Travel Reference (optional)">
          <Input
            placeholder="TR-2025-0001 — link to approved travel request"
            value={formState.travelRequestHandle ?? ""}
            onChange={(e) => onChange({ travelRequestHandle: e.target.value || null })}
            disabled={readonly}
          />
        </Form.Item>
      </div>

      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Date Range</div>
        <div className={styles.fieldRow}>
          <Form.Item label="From Date" required>
            <DatePicker
              format={dateFormat}
              disabled={readonly}
              value={formState.fromDate ? dayjs(formState.fromDate) : null}
              onChange={(_, s) => onChange({ fromDate: (Array.isArray(s) ? s[0] : s) || null })}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item label="To Date" required>
            <DatePicker
              format={dateFormat}
              disabled={readonly}
              value={formState.toDate ? dayjs(formState.toDate) : null}
              onChange={(_, s) => onChange({ toDate: (Array.isArray(s) ? s[0] : s) || null })}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Cost Allocation</div>
        <div className={styles.fieldRow}>
          <Form.Item label="Cost Center" required>
            <Input
              placeholder="CC-001 — Sales"
              value={formState.costCenter}
              onChange={(e) => onChange({ costCenter: e.target.value })}
              disabled={readonly}
            />
          </Form.Item>
          <Form.Item label="Project Code">
            <Input
              placeholder="PRJ-2025-01"
              value={formState.projectCode}
              onChange={(e) => onChange({ projectCode: e.target.value })}
              disabled={readonly}
            />
          </Form.Item>
          <Form.Item label="WBS Code">
            <Input
              placeholder="WBS-001"
              value={formState.wbsCode}
              onChange={(e) => onChange({ wbsCode: e.target.value })}
              disabled={readonly}
            />
          </Form.Item>
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Currency</div>
        <CurrencyFxRow
          currency={formState.currency}
          exchangeRate={formState.exchangeRate}
          readonly={readonly}
          onCurrencyChange={(c) => onChange({ currency: c, exchangeRate: c === "INR" ? 1 : formState.exchangeRate })}
          onRateChange={(r) => onChange({ exchangeRate: r })}
        />
      </div>
    </Form>
  );
};

export default ExpenseHeaderForm;
