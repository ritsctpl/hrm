"use client";

import React from "react";
import { Button, DatePicker, Form, Input, Radio, Select, message } from "antd";
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { ManualAdjustmentFormProps } from "../../types/ui.types";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmLeave.module.css";

const LEAVE_TYPE_OPTIONS = [
  { value: "CL", label: "Casual Leave" },
  { value: "SL", label: "Sick Leave" },
  { value: "PL", label: "Privilege Leave" },
  { value: "CO", label: "Comp Off" },
  { value: "WFH", label: "Work From Home" },
];

const ManualAdjustmentForm: React.FC<ManualAdjustmentFormProps> = ({
  site,
  onAdjusted,
}) => {
  const cookies = parseCookies();
  const userId = cookies.userId ?? "";
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await HrmLeaveService.postManualAdjustment({
        site,
        employeeId: values.employeeId,
        leaveTypeCode: values.leaveTypeCode,
        quantity: parseFloat(values.quantity),
        direction: values.direction,
        transactionDate: values.transactionDate.format("YYYY-MM-DD"),
        reasonCode: values.reasonCode,
        notes: values.notes,
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
        <Form.Item name="employeeId" label="Employee ID" rules={[{ required: true }]}>
          <Input placeholder="Enter employee ID" />
        </Form.Item>
        <Form.Item name="leaveTypeCode" label="Leave Type" rules={[{ required: true }]}>
          <Select options={LEAVE_TYPE_OPTIONS} />
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
        <Can I="add" object="leave_adjustment">
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Post Adjustment
          </Button>
        </Can>
      </Form>
    </div>
  );
};

export default ManualAdjustmentForm;
