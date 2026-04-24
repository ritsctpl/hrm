"use client";

import React, { useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  message,
} from "antd";
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { useEmployeeOptions } from "../../hooks/useEmployeeOptions";
import { useLeaveTypeOptions } from "../../hooks/useLeaveTypeOptions";
import { useEmployeeIdentity } from "../../../hrmAccess/hooks/useEmployeeIdentity";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;

interface BulkAdjustmentFormProps {
  organizationId: string;
  onAdjusted?: () => void;
}

const BulkAdjustmentForm: React.FC<BulkAdjustmentFormProps> = ({ organizationId, onAdjusted }) => {
  const cookies = parseCookies();
  const identity = useEmployeeIdentity();
  // Leave service expects composite "EMP0012 - John Doe" for createdBy.
  const userId = identity.employeeIdWithName || cookies.userId || "";
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { options: employeeOptions, loading: employeeOptionsLoading } = useEmployeeOptions();
  const { options: leaveTypeOptions, loading: leaveTypeOptionsLoading } = useLeaveTypeOptions();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const employeeIds: string[] = values.employeeIds ?? [];
      if (employeeIds.length === 0) {
        message.warning("Please add at least one employee");
        return;
      }
      const delta: number = Number(values.delta);
      if (!delta || Number.isNaN(delta)) {
        message.warning("Delta must be a non-zero number");
        return;
      }
      const direction: "CR" | "DR" = delta >= 0 ? "CR" : "DR";
      const quantity = Math.abs(delta);
      const transactionDate = values.effectiveDate.format("YYYY-MM-DD");
      setLoading(true);
      await HrmLeaveService.bulkAdjustment({ organizationId,
        adjustments: employeeIds.map((employeeId) => ({ organizationId,
          employeeId,
          leaveTypeCode: values.leaveTypeCode,
          quantity,
          direction,
          transactionDate,
          reasonCode: values.reasonCode,
          notes: values.reason,
          createdBy: userId,
        })),
      });
      message.success(`Bulk adjustment applied to ${employeeIds.length} employee(s)`);
      form.resetFields();
      onAdjusted?.();
    } catch {
      message.error("Failed to post bulk adjustment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.bulkAdjustmentForm}>
      <Text type="secondary">
        Apply the same credit/debit to multiple employees in one transaction.
      </Text>
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item
          name="employeeIds"
          label="Employees"
          rules={[{ required: true, message: "Add at least one employee" }]}
        >
          <Select
            mode="multiple"
            showSearch
            allowClear
            placeholder="Search and select employees"
            options={employeeOptions}
            loading={employeeOptionsLoading}
            tokenSeparators={[",", " ", "\n"]}
            style={{ width: "100%" }}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            maxTagCount="responsive"
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
        <Form.Item
          name="delta"
          label="Delta (days)"
          rules={[{ required: true }]}
          extra="Positive = credit, Negative = debit"
        >
          <InputNumber style={{ width: "100%" }} step={0.5} />
        </Form.Item>
        <Form.Item name="effectiveDate" label="Effective Date" rules={[{ required: true }]}>
          <DatePicker format="DD-MMM-YYYY" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="reasonCode" label="Reason Code" rules={[{ required: true }]}>
          <Input placeholder="e.g. CORRECTION, ANNUAL_GRANT" />
        </Form.Item>
        <Form.Item name="reason" label="Notes / Reason">
          <Input.TextArea rows={3} placeholder="Optional description" />
        </Form.Item>
        <Can I="add" object="leave_adjustment" passIf={true}>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Apply Bulk Adjustment
          </Button>
        </Can>
      </Form>
    </div>
  );
};

export default BulkAdjustmentForm;
