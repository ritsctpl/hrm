"use client";

import React from "react";
import { Form, Input, Radio, DatePicker } from "antd";
import { getOrganizationId } from "@/utils/cookieUtils";
import type { ExpenseFormState } from "../../types/ui.types";
import type { ExpenseFormErrors } from "../../utils/expenseValidations";
import CurrencyFxRow from "../molecules/CurrencyFxRow";
import TravelRequestPicker from "../molecules/TravelRequestPicker";
import ProjectPicker, { type ProjectOption } from "../molecules/ProjectPicker";
import CostCenterPicker from "../molecules/CostCenterPicker";
import UnsettledAdvancePicker from "../molecules/UnsettledAdvancePicker";
import { HrmProjectService } from "../../../hrmProject/services/hrmProjectService";
import { useEmployeeIdentity } from "../../../hrmAccess/hooks/useEmployeeIdentity";
import styles from "../../styles/ExpenseForm.module.css";
import dayjs from "dayjs";
import { DATE_DISPLAY_FORMAT, parseDateForPicker } from "../../utils/dateHelpers";

interface Props {
  formState: ExpenseFormState;
  onChange: (changes: Partial<ExpenseFormState>) => void;
  readonly?: boolean;
  errors?: ExpenseFormErrors;
}

const dateFormat = DATE_DISPLAY_FORMAT;

// ADVANCE expenses must always be future-dated; reimbursement / mileage
// allow past dates because they describe what already happened.
const isPastBlocked = (expenseType: ExpenseFormState['expenseType']) => expenseType === 'ADVANCE';

const ExpenseHeaderForm: React.FC<Props> = ({ formState, onChange, readonly, errors = {} }) => {
  const organizationId = getOrganizationId();
  const identity = useEmployeeIdentity();
  const employeeId = identity.employeeCode;

  const blockPast = isPastBlocked(formState.expenseType);

  const disabledFromDate = (current: dayjs.Dayjs) => {
    if (!current) return false;
    const isPast = blockPast && current.isBefore(dayjs(), 'day');
    const after = formState.toDate
      ? current.isAfter(dayjs(formState.toDate, dateFormat), 'day')
      : false;
    return isPast || after;
  };

  const disabledToDate = (current: dayjs.Dayjs) => {
    if (!current) return false;
    const isPast = blockPast && current.isBefore(dayjs(), 'day');
    const before = formState.fromDate
      ? current.isBefore(dayjs(formState.fromDate, dateFormat), 'day')
      : false;
    return isPast || before;
  };

  // Auto-fill from travel request: prefill dates and purpose suggestion.
  const handleTravelSelect = (handle: string | null, travel?: import("../../../hrmTravel/types/domain.types").TravelRequest) => {
    const changes: Partial<ExpenseFormState> = { travelRequestHandle: handle };
    if (travel) {
      const fmt = (iso?: string) => iso ? dayjs(iso).format(dateFormat) : null;
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

  const isReimbursement = formState.expenseType === "REIMBURSEMENT";

  return (
    <Form layout="vertical" component="div">
      <div className={styles.formSection}>
        <Form.Item
          label="Expense Type"
          required
          validateStatus={errors.expenseType ? "error" : undefined}
          help={errors.expenseType}
          style={{ marginBottom: 8 }}
        >
          <Radio.Group
            value={formState.expenseType}
            onChange={(e) => onChange({ expenseType: e.target.value })}
            disabled={readonly}
          >
            <Radio value="ADVANCE">Advance</Radio>
            <Radio value="REIMBURSEMENT">Reimbursement</Radio>
            <Radio value="MILEAGE">Mileage</Radio>
            <Radio value="TRAVEL">Travel</Radio>
            <Radio value="GENERAL">General</Radio>
          </Radio.Group>
        </Form.Item>

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
        <div className={styles.sectionTitle}>Links &amp; Period</div>
        <div className={styles.fieldRow}>
          <Form.Item label="Travel Request" style={{ marginBottom: 8 }}>
            <TravelRequestPicker
              organizationId={organizationId}
              employeeId={employeeId}
              value={formState.travelRequestHandle}
              disabled={readonly}
              onChange={handleTravelSelect}
            />
          </Form.Item>
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
        </div>
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
      </div>

      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Cost Allocation &amp; Currency</div>
        <div className={styles.fieldRow}>
          <Form.Item
            label="Cost Center (BU)"
            required
            validateStatus={errors.costCenter ? "error" : undefined}
            help={errors.costCenter}
            style={{ marginBottom: 8 }}
          >
            <CostCenterPicker
              organizationId={organizationId}
              value={formState.costCenter}
              disabled={readonly}
              onChange={(v) => onChange({ costCenter: v })}
            />
          </Form.Item>
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
