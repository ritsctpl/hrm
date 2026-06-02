"use client";

import React, { useState } from "react";
import { Form, Input, DatePicker, Button, Tag, Typography } from "antd";
import {
  DollarOutlined,
  CarOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { getOrganizationId } from "@/utils/cookieUtils";
import type { ExpenseFormState } from "../../types/ui.types";
import type { ExpenseFormErrors } from "../../utils/expenseValidations";
import CurrencyFxRow from "../molecules/CurrencyFxRow";
import TravelRequestPicker from "../molecules/TravelRequestPicker";
import ProjectPicker, { type ProjectOption } from "../molecules/ProjectPicker";
import CostCenterPicker from "../molecules/CostCenterPicker";
import UnsettledAdvancePicker from "../molecules/UnsettledAdvancePicker";
import { EXPENSE_TYPE_LABELS } from "../../utils/expenseConstants";
import { HrmProjectService } from "../../../hrmProject/services/hrmProjectService";
import { useEmployeeIdentity } from "../../../hrmAccess/hooks/useEmployeeIdentity";
import styles from "../../styles/ExpenseForm.module.css";
import dayjs from "dayjs";
import { DATE_DISPLAY_FORMAT, parseDateForPicker } from "../../utils/dateHelpers";

const { Text } = Typography;

interface Props {
  formState: ExpenseFormState;
  onChange: (changes: Partial<ExpenseFormState>) => void;
  readonly?: boolean;
  errors?: ExpenseFormErrors;
}

const dateFormat = DATE_DISPLAY_FORMAT;

// ADVANCE expenses must always be future-dated; reimbursement / mileage
// allow past dates because they describe what already happened.
const isPastBlocked = (expenseType: ExpenseFormState["expenseType"]) =>
  expenseType === "ADVANCE";

type TypeChoice = {
  value: "REIMBURSEMENT" | "MILEAGE" | "ADVANCE";
  label: string;
  description: string;
  icon: React.ReactNode;
};

const TYPE_CHOICES: TypeChoice[] = [
  {
    value: "REIMBURSEMENT",
    label: "I spent money",
    description: "Reimbursement",
    icon: <DollarOutlined />,
  },
  {
    value: "MILEAGE",
    label: "I drove for work",
    description: "Mileage",
    icon: <CarOutlined />,
  },
  {
    value: "ADVANCE",
    label: "I need money upfront",
    description: "Advance",
    icon: <WalletOutlined />,
  },
];

const ExpenseHeaderForm: React.FC<Props> = ({ formState, onChange, readonly, errors = {} }) => {
  const organizationId = getOrganizationId();
  const identity = useEmployeeIdentity();
  const employeeId = identity.employeeCode;

  const blockPast = isPastBlocked(formState.expenseType);
  const isReimbursement = formState.expenseType === "REIMBURSEMENT";
  // TRAVEL and ADVANCE genuinely bracket a period (trip dates, advance window).
  // For REIMBURSEMENT / MILEAGE / GENERAL a single date is enough — the line
  // items already carry their own per-item dates.
  const needsDateRange =
    formState.expenseType === "TRAVEL" || formState.expenseType === "ADVANCE";
  // Project / WBS are hidden by default. They auto-reveal when the user already has values.
  const [showProjectFields, setShowProjectFields] = useState(
    !!formState.projectCode || !!formState.wbsCode,
  );

  const disabledFromDate = (current: dayjs.Dayjs) => {
    if (!current) return false;
    const isPast = blockPast && current.isBefore(dayjs(), "day");
    const after = formState.toDate
      ? current.isAfter(dayjs(formState.toDate, dateFormat), "day")
      : false;
    return isPast || after;
  };

  const disabledToDate = (current: dayjs.Dayjs) => {
    if (!current) return false;
    const isPast = blockPast && current.isBefore(dayjs(), "day");
    const before = formState.fromDate
      ? current.isBefore(dayjs(formState.fromDate, dateFormat), "day")
      : false;
    return isPast || before;
  };

  // Auto-fill from travel request: prefill dates and purpose. Picking a travel
  // request implicitly sets the type to TRAVEL.
  const handleTravelSelect = (
    handle: string | null,
    travel?: import("../../../hrmTravel/types/domain.types").TravelRequest,
  ) => {
    const changes: Partial<ExpenseFormState> = { travelRequestHandle: handle };
    if (handle) {
      changes.expenseType = "TRAVEL";
    } else if (formState.expenseType === "TRAVEL") {
      // Clearing the travel link falls back to REIMBURSEMENT.
      changes.expenseType = "REIMBURSEMENT";
    }
    if (travel) {
      const fmt = (iso?: string) => (iso ? dayjs(iso).format(dateFormat) : null);
      if (travel.startDate && !formState.fromDate) changes.fromDate = fmt(travel.startDate);
      if (travel.endDate && !formState.toDate) changes.toDate = fmt(travel.endDate);
      if (!formState.purpose?.trim()) {
        changes.purpose = `${travel.purpose} (Travel: ${travel.destinationCity})`;
      }
    }
    onChange(changes);
  };

  // Auto-fill from project: store projectCode now; async-lookup buCode to set cost center.
  const handleProjectSelect = async (projectCode: string | null, project?: ProjectOption) => {
    onChange({ projectCode: projectCode ?? "" });
    if (!projectCode || !project) return;
    // Only overwrite cost center if it was empty — respect user's manual choice.
    if (formState.costCenter?.trim()) return;
    try {
      const full = await HrmProjectService.getProject(organizationId, project.projectHandle);
      if (full?.buCode) {
        onChange({ costCenter: full.buCode });
      }
    } catch (err) {
      console.error("[Expense] Failed to fetch project detail for BU auto-fill:", err);
    }
  };

  const isTravel = formState.expenseType === "TRAVEL";
  const showButtonPicker =
    !readonly && (formState.expenseType == null || isTravel ||
      TYPE_CHOICES.some((c) => c.value === formState.expenseType));

  return (
    <Form layout="vertical" component="div">
      <div className={styles.formSection}>
        {/* Type picker — 3 plain-English buttons in create/edit, label in view mode. */}
        <Form.Item
          label={readonly ? "Expense type" : "What are you claiming?"}
          required={!readonly}
          validateStatus={errors.expenseType ? "error" : undefined}
          help={errors.expenseType}
          style={{ marginBottom: 12 }}
        >
          {readonly ? (
            <Tag color="blue">
              {EXPENSE_TYPE_LABELS[formState.expenseType ?? ""] ?? "—"}
            </Tag>
          ) : showButtonPicker ? (
            <div className={styles.typeButtonRow}>
              {TYPE_CHOICES.map((choice) => {
                const isActive = formState.expenseType === choice.value;
                return (
                  <button
                    key={choice.value}
                    type="button"
                    className={`${styles.typeButton} ${isActive ? styles.typeButtonActive : ""}`}
                    onClick={() => {
                      const changes: Partial<ExpenseFormState> = { expenseType: choice.value };
                      // Switching away from a travel-typed draft clears the link.
                      if (formState.travelRequestHandle && choice.value !== "REIMBURSEMENT") {
                        changes.travelRequestHandle = null;
                      }
                      onChange(changes);
                    }}
                  >
                    <span className={styles.typeButtonIcon}>{choice.icon}</span>
                    <span className={styles.typeButtonLabel}>{choice.label}</span>
                    <span className={styles.typeButtonSub}>{choice.description}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <Tag color="blue">
              {EXPENSE_TYPE_LABELS[formState.expenseType ?? ""] ?? "—"}
            </Tag>
          )}
        </Form.Item>

        {/* Travel request picker — small inline row under the type picker. */}
        {!readonly && (
          <Form.Item
            label={
              <span style={{ fontSize: 12, color: "#595959" }}>
                Tied to a travel request? (optional)
              </span>
            }
            style={{ marginBottom: 12 }}
          >
            <TravelRequestPicker
              organizationId={organizationId}
              employeeId={employeeId}
              value={formState.travelRequestHandle}
              disabled={readonly}
              onChange={handleTravelSelect}
            />
          </Form.Item>
        )}

        <Form.Item
          label="Purpose"
          required
          validateStatus={errors.purpose ? "error" : undefined}
          help={errors.purpose}
          style={{ marginBottom: 0 }}
        >
          <Input.TextArea
            placeholder="Describe the purpose of this expense"
            rows={2}
            value={formState.purpose}
            onChange={(e) => onChange({ purpose: e.target.value })}
            disabled={readonly}
          />
        </Form.Item>
      </div>

      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>
          {needsDateRange ? "Period" : "Date"}
        </div>
        {isReimbursement && (
          <Form.Item label="Linked Advance" style={{ marginBottom: 8 }}>
            <UnsettledAdvancePicker
              organizationId={organizationId}
              employeeId={employeeId}
              value={formState.linkedAdvanceHandle}
              disabled={readonly}
              onChange={(handle) => onChange({ linkedAdvanceHandle: handle })}
            />
          </Form.Item>
        )}
        {needsDateRange ? (
          <div className={styles.fieldRow}>
            <Form.Item
              label="From Date"
              required
              validateStatus={errors.fromDate || errors.dateRange ? "error" : undefined}
              help={errors.fromDate}
              style={{ marginBottom: 0 }}
            >
              <DatePicker
                format={dateFormat}
                disabled={readonly}
                value={parseDateForPicker(formState.fromDate)}
                onChange={(_, s) => onChange({ fromDate: (Array.isArray(s) ? s[0] : s) || null })}
                disabledDate={disabledFromDate}
                style={{ width: "100%" }}
              />
            </Form.Item>
            <Form.Item
              label="To Date"
              required
              validateStatus={errors.toDate || errors.dateRange ? "error" : undefined}
              help={errors.toDate || errors.dateRange}
              style={{ marginBottom: 0 }}
            >
              <DatePicker
                format={dateFormat}
                disabled={readonly}
                value={parseDateForPicker(formState.toDate)}
                onChange={(_, s) => onChange({ toDate: (Array.isArray(s) ? s[0] : s) || null })}
                disabledDate={disabledToDate}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </div>
        ) : (
          <Form.Item
            label="Date"
            required
            validateStatus={errors.fromDate || errors.dateRange ? "error" : undefined}
            help={errors.fromDate || errors.dateRange}
            style={{ marginBottom: 0 }}
          >
            <DatePicker
              format={dateFormat}
              disabled={readonly}
              value={parseDateForPicker(formState.fromDate)}
              onChange={(_, s) => {
                // Single-date types: fromDate == toDate so the backend contract is preserved.
                const v = (Array.isArray(s) ? s[0] : s) || null;
                onChange({ fromDate: v, toDate: v });
              }}
              disabledDate={disabledFromDate}
              style={{ width: 240 }}
            />
          </Form.Item>
        )}
      </div>

      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Charge to</div>
        <div className={styles.fieldRow}>
          <Form.Item
            label="Cost Center"
            required
            validateStatus={errors.costCenter ? "error" : undefined}
            help={errors.costCenter}
            style={{ marginBottom: 8, flex: 1 }}
          >
            <CostCenterPicker
              organizationId={organizationId}
              value={formState.costCenter}
              disabled={readonly}
              onChange={(v) => onChange({ costCenter: v })}
            />
          </Form.Item>
        </div>

        {/* Project + WBS are hidden by default — most users only need cost center. */}
        {!readonly && !showProjectFields && (
          <Button
            type="link"
            size="small"
            style={{ padding: 0, fontSize: 12 }}
            onClick={() => setShowProjectFields(true)}
          >
            Need to charge a project? ↓
          </Button>
        )}
        {(showProjectFields || readonly) && (
          <div className={styles.fieldRow}>
            <Form.Item label="Project" style={{ marginBottom: 8 }}>
              <ProjectPicker
                organizationId={organizationId}
                employeeId={employeeId}
                value={formState.projectCode || null}
                disabled={readonly}
                onChange={handleProjectSelect}
              />
            </Form.Item>
            <Form.Item label="WBS Code" tooltip="Work Breakdown Structure code" style={{ marginBottom: 8 }}>
              <Input
                placeholder="WBS-001"
                value={formState.wbsCode}
                onChange={(e) => onChange({ wbsCode: e.target.value })}
                disabled={readonly}
              />
            </Form.Item>
          </div>
        )}

        <CurrencyFxRow
          currency={formState.currency}
          exchangeRate={formState.exchangeRate}
          readonly={readonly}
          onCurrencyChange={(c) =>
            onChange({ currency: c, exchangeRate: c === "INR" ? 1 : formState.exchangeRate })
          }
          onRateChange={(r) => onChange({ exchangeRate: r })}
        />
      </div>
    </Form>
  );
};

export default ExpenseHeaderForm;
