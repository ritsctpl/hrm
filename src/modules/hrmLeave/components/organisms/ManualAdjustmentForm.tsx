"use client";

import React from "react";
import { Button, DatePicker, Form, Input, Radio, Select, message } from "antd";
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { HrmEmployeeService } from "../../../hrmEmployee/services/hrmEmployeeService";
import { ManualAdjustmentFormProps } from "../../types/ui.types";
import { useEmployeeOptions } from "../../hooks/useEmployeeOptions";
import { useLeaveTypeOptions } from "../../hooks/useLeaveTypeOptions";
import { useEmployeeIdentity } from "../../../hrmAccess/hooks/useEmployeeIdentity";
import {
  checkGenderMaritalEligibility,
  isMaternityCode,
  isPaternityCode,
} from "../../utils/constants";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmLeave.module.css";

const ManualAdjustmentForm: React.FC<ManualAdjustmentFormProps> = ({ organizationId,
  onAdjusted,
}) => {
  const cookies = parseCookies();
  const identity = useEmployeeIdentity();
  // Leave service expects composite "EMP0012 - John Doe" for createdBy.
  const userId = identity.employeeIdWithName || cookies.userId || "";
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const { options: employeeOptions, loading: employeeOptionsLoading } = useEmployeeOptions();
  const { options: leaveTypeOptions, loading: leaveTypeOptionsLoading } = useLeaveTypeOptions();

  const handleSubmit = async () => {
    let values: Record<string, unknown>;
    try {
      values = await form.validateFields();
    } catch {
      // Ant's own validation messages already surface below each field.
      return;
    }

    // Maternity / Paternity gender + marital status eligibility (item 1).
    // Fetch the target employee's profile so the admin can't credit/debit
    // those leave types for ineligible employees.
    const code = values.leaveTypeCode as string;
    if (isMaternityCode(code) || isPaternityCode(code)) {
      const targetOption = employeeOptions.find((o) => o.value === values.employeeId);
      const handle = targetOption?.handle;
      if (handle) {
        try {
          const profile = await HrmEmployeeService.fetchProfile(organizationId, handle);
          const eligibility = checkGenderMaritalEligibility(
            code,
            profile?.personalDetails?.gender,
            profile?.personalDetails?.maritalStatus,
          );
          if (!eligibility.ok) {
            message.error(eligibility.reason);
            return;
          }
        } catch {
          // If the profile lookup fails we don't block — the BE still
          // validates and will surface its own error.
        }
      }
    }

    try {
      setLoading(true);
      await HrmLeaveService.postManualAdjustment({ organizationId,
        employeeId: values.employeeId as string,
        leaveTypeCode: code,
        quantity: parseFloat(String(values.quantity)),
        direction: values.direction as "CR" | "DR",
        transactionDate: (values.transactionDate as import("dayjs").Dayjs).format("YYYY-MM-DD"),
        reasonCode: values.reasonCode as string,
        notes: values.notes as string | undefined,
        createdBy: userId,
      });
      message.success("Adjustment posted successfully");
      form.resetFields();
      onAdjusted();
    } catch {
      message.error("Failed to post adjustment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.adjustmentForm}>
      <Form form={form} layout="vertical">
        <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
          <Select
            showSearch
            allowClear
            placeholder="Search by ID or name"
            options={employeeOptions}
            loading={employeeOptionsLoading}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item name="leaveTypeCode" label="Leave Type" rules={[{ required: true }]}>
          <Select
            showSearch
            options={leaveTypeOptions}
            loading={leaveTypeOptionsLoading}
            placeholder="Select leave type"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item name="direction" label="Direction" rules={[{ required: true }]}>
          <Radio.Group>
            <Radio.Button value="CR">Credit (CR)</Radio.Button>
            <Radio.Button value="DR">Debit (DR)</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="quantity" label="Quantity (days)" rules={[{ required: true }]}>
          <Input type="number" min="0.5" step="0.5" />
        </Form.Item>
        <Form.Item name="transactionDate" label="Transaction Date" rules={[{ required: true }]}>
          <DatePicker format="DD-MMM-YYYY" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="reasonCode" label="Reason Code" rules={[{ required: true }]}>
          <Input placeholder="e.g. CORRECTION, ANNUAL_GRANT" />
        </Form.Item>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Can I="add" object="leave_adjustment" passIf={true}>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Post Adjustment
          </Button>
        </Can>
      </Form>
    </div>
  );
};

export default ManualAdjustmentForm;
