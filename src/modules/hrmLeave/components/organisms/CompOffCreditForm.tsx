"use client";

import React from "react";
import { Button, DatePicker, Form, Input, Select, message } from "antd";
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { CompOffCreditFormProps } from "../../types/ui.types";
import { useEmployeeOptions } from "../../hooks/useEmployeeOptions";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmLeave.module.css";

const CompOffCreditForm: React.FC<CompOffCreditFormProps> = ({ site, onCredited }) => {
  const cookies = parseCookies();
  const userId = cookies.userId ?? "";
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const { options: employeeOptions, loading: employeeOptionsLoading } = useEmployeeOptions();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await HrmLeaveService.creditCompOff({
        site,
        employeeId: values.employeeId,
        workedOnDate: values.workedOnDate.format("YYYY-MM-DD"),
        quantity: parseFloat(values.quantity),
        supervisorId: values.supervisorId,
        expiryDate: values.expiryDate ? values.expiryDate.format("YYYY-MM-DD") : undefined,
        notes: values.notes,
        createdBy: userId,
      });
      message.success("Comp-off credited successfully");
      form.resetFields();
      onCredited();
    } catch {
      message.error("Failed to credit comp-off");
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
        <Form.Item name="supervisorId" label="Supervisor">
          <Select
            showSearch
            allowClear
            placeholder="Search supervisor by ID or name"
            options={employeeOptions}
            loading={employeeOptionsLoading}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item name="workedOnDate" label="Worked On Date" rules={[{ required: true }]}>
          <DatePicker format="DD-MMM-YYYY" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="quantity" label="Days Worked (comp-off)" rules={[{ required: true }]}>
          <Input type="number" min="0.5" step="0.5" />
        </Form.Item>
        <Form.Item name="expiryDate" label="Expiry Date">
          <DatePicker format="DD-MMM-YYYY" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Can I="add" object="leave_comp_off" passIf={true}>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Credit Comp Off
          </Button>
        </Can>
      </Form>
    </div>
  );
};

export default CompOffCreditForm;
