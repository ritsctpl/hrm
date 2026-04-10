'use client';

import React from "react";
import { Button, DatePicker, Form, Input, InputNumber, Select } from "antd";
import Can from "../../../hrmAccess/components/Can";
import { useHrmAppraisalStore } from "../../stores/hrmAppraisalStore";
import { HrmAppraisalService } from "../../services/hrmAppraisalService";
import { parseCookies } from "nookies";
import { message } from "antd";

const CycleConfigForm: React.FC = () => {
  const [form] = Form.useForm();
  const { fetchCycles } = useHrmAppraisalStore();

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const site = parseCookies().site ?? "";
      await HrmAppraisalService.createCycle({
        ...values,
        site,
        periodStart: values.period?.[0]?.format("YYYY-MM-DD"),
        periodEnd: values.period?.[1]?.format("YYYY-MM-DD"),
      });
      message.success("Cycle created");
      form.resetFields();
      await fetchCycles();
    } catch {
      // validation errors inline
    }
  };

  return (
    <Form form={form} layout="vertical" size="small" style={{ maxWidth: 560 }}>
      <Form.Item name="cycleName" label="Cycle Name" rules={[{ required: true }]}>
        <Input placeholder="e.g. Annual Performance Review 2025-26" />
      </Form.Item>
      <Form.Item name="cycleType" label="Cycle Type" rules={[{ required: true }]}>
        <Select
          options={["ANNUAL", "SEMI_ANNUAL", "QUARTERLY", "PROBATION"].map((t) => ({
            value: t,
            label: t,
          }))}
        />
      </Form.Item>
      <Form.Item name="period" label="Period" rules={[{ required: true }]}>
        <DatePicker.RangePicker style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name="goalWeightPercentage" label="Goal Weight (%)" initialValue={70}>
        <InputNumber min={0} max={100} style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item
        name="competencyWeightPercentage"
        label="Competency Weight (%)"
        initialValue={30}
      >
        <InputNumber min={0} max={100} style={{ width: "100%" }} />
      </Form.Item>
      <Can I="add">
        <Button type="primary" onClick={handleCreate}>
          Create Cycle
        </Button>
      </Can>
    </Form>
  );
};

export default CycleConfigForm;
