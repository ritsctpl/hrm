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
  const { options: leaveTypeOptions, leaveTypes, loading: leaveTypeOptionsLoading } = useLeaveTypeOptions();

  const handleSubmit = async () => {
    let values: Record<string, unknown>;
    try {
      values = await form.validateFields();
    } catch {
      // Ant's own validation messages already surface below each field.
      return;
    }

    // Eligibility check (item 1) — combines two rules:
    //   1. Hardcoded Maternity / Paternity (ML / PAT codes always need
    //      married female / married male).
    //   2. Policy-driven applicableGender + applicableMaritalStatus on
    //      the effective Leave Policy. This covers every other leave
    //      type whose policy carries an applicability restriction
    //      (e.g. an HR-defined "Spouse Care" with marital = MARRIED).
    // Both rules require the target employee's profile, so we fetch it
    // once and reuse for both checks.
    const code = values.leaveTypeCode as string;
    const targetOption = employeeOptions.find((o) => o.value === values.employeeId);
    const handle = targetOption?.handle;
    if (handle) {
      let empGender: string | undefined;
      let empMarital: string | undefined;
      try {
        const profile = await HrmEmployeeService.fetchProfile(organizationId, handle);
        empGender = profile?.personalDetails?.gender;
        empMarital = profile?.personalDetails?.maritalStatus;
      } catch {
        // Profile fetch failed — let the BE validate, no client block.
      }

      // Rule 1: hardcoded ML / PAT short-circuit.
      if (isMaternityCode(code) || isPaternityCode(code)) {
        const eligibility = checkGenderMaritalEligibility(code, empGender, empMarital);
        if (!eligibility.ok) {
          message.error(eligibility.reason);
          return;
        }
      }

      // Rule 2: policy-driven check — fetch the effective policy for the
      // leave type and compare its applicability against the employee.
      const lt = leaveTypes.find((t) => t.code === code);
      if (lt?.handle && (empGender || empMarital)) {
        try {
          const policy = await HrmLeaveService.getEffectivePolicy({
            organizationId,
            leaveTypeId: lt.handle,
          });
          if (policy) {
            const allowedGender = (policy.applicableGender ?? "ALL").toUpperCase();
            const allowedMarital = (policy.applicableMaritalStatus ?? "ALL").toUpperCase();
            const empG = (empGender ?? "").toUpperCase();
            const empM = (empMarital ?? "").toUpperCase();
            if (allowedGender !== "ALL" && empG && allowedGender !== empG) {
              message.error(
                `${lt.name} (${code}) is restricted to ${allowedGender.toLowerCase()} employees per policy.`,
              );
              return;
            }
            if (allowedMarital !== "ALL" && empM && allowedMarital !== empM) {
              message.error(
                `${lt.name} (${code}) is restricted to ${allowedMarital.toLowerCase()} employees per policy.`,
              );
              return;
            }
          }
        } catch {
          // Policy fetch failed — the BE still validates on submit.
        }
      }
    }

    // try {
    //   setLoading(true);
    //   await HrmLeaveService.postManualAdjustment({ organizationId,
    //     employeeId: values.employeeId as string,
    //     leaveTypeCode: code,
    //     quantity: parseFloat(String(values.quantity)),
    //     direction: values.direction as "CR" | "DR",
    //     transactionDate: (values.transactionDate as import("dayjs").Dayjs).format("YYYY-MM-DD"),
    //     reasonCode: values.reasonCode as string,
    //     notes: values.notes as string | undefined,
    //     createdBy: userId,
    //   });
    //   message.success("Adjustment posted successfully");
    //   form.resetFields();
    //   onAdjusted();
    // } catch {
    //   message.error("Failed to post adjustment");
    // } finally {
    //   setLoading(false);
    // }

    try {
      setLoading(true);

      const response: any = await HrmLeaveService.postManualAdjustment({
        organizationId,
        employeeId: values.employeeId as string,
        leaveTypeCode: code,
        quantity: parseFloat(String(values.quantity)),
        direction: values.direction as "CR" | "DR",
        transactionDate: (values.transactionDate as import("dayjs").Dayjs).format("YYYY-MM-DD"),
        reasonCode: values.reasonCode as string,
        notes: values.notes as string | undefined,
        createdBy: userId,
      });

      message.success(
        response?.data?.message_details?.msg || "Adjustment posted successfully"
      );

      form.resetFields();
      onAdjusted();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message_details?.error ||
          "Failed to post adjustment"
      );
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
