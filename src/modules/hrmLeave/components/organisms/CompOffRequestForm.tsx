"use client";

import React, { useState } from "react";
import { Drawer, Form, DatePicker, InputNumber, Input, Button, message, Typography } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { parseCookies } from "nookies";
import { getOrganizationId } from "@/utils/cookieUtils";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { useHrmLeaveStore } from "../../stores/hrmLeaveStore";

const { TextArea } = Input;
const { Text } = Typography;

interface CompOffRequestFormProps {
  onSubmitted: () => void;
}

const CompOffRequestForm: React.FC<CompOffRequestFormProps> = ({ onSubmitted }) => {
  const organizationId = getOrganizationId();
  const cookies = parseCookies();
  const employeeId = cookies.employeeId ?? cookies.userId ?? "";
  const { showCompOffForm, closeCompOffForm } = useHrmLeaveStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [autoQuantity, setAutoQuantity] = useState<number>(0);

  const handleHoursChange = (hours: number | null) => {
    if (!hours) {
      setAutoQuantity(0);
      return;
    }
    const qty = hours >= 8 ? 1 : hours >= 4 ? 0.5 : 0;
    setAutoQuantity(qty);
    form.setFieldsValue({ quantity: qty });
  };

  const disableFutureDates = (current: Dayjs) => {
    return current && current.isAfter(dayjs().endOf("day"));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (values.quantity <= 0) {
        message.warning("Minimum 4 hours required to claim comp-off");
        return;
      }
      setLoading(true);
      await HrmLeaveService.submitCompOffRequest({
        organizationId,
        employeeId,
        workedDate: values.workedDate.format("YYYY-MM-DD"),
        hours: values.hours,
        quantity: values.quantity,
        reason: values.reason,
        createdBy: employeeId,
      });
      message.success("Comp-off request submitted");
      form.resetFields();
      setAutoQuantity(0);
      closeCompOffForm();
      onSubmitted();
    } catch {
      message.error("Failed to submit comp-off request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title="Request Comp-Off"
      open={showCompOffForm}
      onClose={closeCompOffForm}
      width={480}
      destroyOnClose
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={closeCompOffForm}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Submit Request
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="workedDate"
          label="Worked Date"
          rules={[{ required: true, message: "Please select the date you worked" }]}
        >
          <DatePicker
            format="DD-MMM-YYYY"
            style={{ width: "100%" }}
            disabledDate={disableFutureDates}
            placeholder="Select the date you worked"
          />
        </Form.Item>

        <Form.Item
          name="hours"
          label="Hours Worked"
          rules={[
            { required: true, message: "Please enter hours worked" },
            { type: "number", min: 4, message: "Minimum 4 hours required" },
          ]}
        >
          <InputNumber
            min={4}
            max={24}
            style={{ width: "100%" }}
            placeholder="Enter hours worked"
            onChange={handleHoursChange}
          />
        </Form.Item>

        <Form.Item name="quantity" label="Days to Credit">
          <InputNumber
            style={{ width: "100%" }}
            disabled
            value={autoQuantity}
          />
        </Form.Item>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: -16, marginBottom: 16 }}>
          Auto-calculated: 8+ hours = 1 day, 4-7 hours = 0.5 day
        </Text>

        <Form.Item
          name="reason"
          label="Reason"
          rules={[{ required: true, message: "Please provide a reason" }]}
        >
          <TextArea rows={4} placeholder="Describe why you worked on this day" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default CompOffRequestForm;
