'use client';

import React, { useEffect } from "react";
import { Button, DatePicker, Divider, Drawer, Form, Input, InputNumber, Select, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useHrmAppraisalStore } from "../../stores/hrmAppraisalStore";
import type { AppraisalGoal } from "../../types/domain.types";
import dayjs from "dayjs";

const GoalFormModal: React.FC = () => {
  const [form] = Form.useForm();
  const {
    goalFormOpen,
    goalFormState,
    selectedGoal,
    savingGoal,
    activeCycle,
    setGoalFormOpen,
    createGoal,
    updateGoal,
  } = useHrmAppraisalStore();

  useEffect(() => {
    if (goalFormOpen) {
      if (goalFormState === "EDIT" && selectedGoal) {
        form.setFieldsValue({
          ...selectedGoal,
          startDate: selectedGoal.startDate ? dayjs(selectedGoal.startDate) : undefined,
          targetDate: selectedGoal.targetDate ? dayjs(selectedGoal.targetDate) : undefined,
        });
      } else {
        form.resetFields();
        form.setFieldValue("keyResults", [{ description: "", targetValue: 0, unit: "count" }]);
      }
    }
  }, [goalFormOpen, goalFormState, selectedGoal, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        cycleId: activeCycle?.cycleId ?? "",
        startDate: values.startDate?.format("YYYY-MM-DD") ?? "",
        targetDate: values.targetDate?.format("YYYY-MM-DD") ?? "",
      };

      if (goalFormState === "EDIT" && selectedGoal) {
        await updateGoal({ ...selectedGoal, ...payload } as AppraisalGoal);
      } else {
        await createGoal(payload as Omit<AppraisalGoal, "goalId">);
      }
    } catch {
      // validation errors inline
    }
  };

  return (
    <Drawer
      title={goalFormState === "EDIT" ? "Edit Goal" : "Add Goal"}
      open={goalFormOpen}
      onClose={() => setGoalFormOpen(false)}
      width={480}
      footer={
        <Space style={{ justifyContent: "flex-end", width: "100%" }}>
          <Button onClick={() => setGoalFormOpen(false)}>Cancel</Button>
          <Button loading={savingGoal} onClick={() => handleSubmit()}>
            Save as Draft
          </Button>
          <Button type="primary" loading={savingGoal} onClick={handleSubmit}>
            Submit
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" size="small">
        <Form.Item name="goalTitle" label="Goal Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="goalDescription" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Form.Item name="goalCategory" label="Category" rules={[{ required: true }]}>
            <Select
              options={["BUSINESS", "DEVELOPMENT", "STRETCH", "LEARNING"].map((c) => ({
                value: c,
                label: c,
              }))}
            />
          </Form.Item>
          <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
            <Select
              options={["HIGH", "MEDIUM", "LOW"].map((p) => ({ value: p, label: p }))}
            />
          </Form.Item>
        </div>
        <Form.Item
          name="weightPercentage"
          label="Weight (%)"
          rules={[{ required: true }, { type: "number", min: 1, max: 100 }]}
        >
          <InputNumber min={1} max={100} style={{ width: "100%" }} />
        </Form.Item>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Form.Item name="startDate" label="Start Date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="targetDate" label="Target Date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </div>

        <Divider>Key Results</Divider>
        <Form.List name="keyResults">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 24px", gap: 8, alignItems: "flex-end", marginBottom: 8 }}
                >
                  <Form.Item {...restField} name={[name, "description"]} noStyle>
                    <Input placeholder="Description" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "targetValue"]} noStyle>
                    <InputNumber placeholder="Target" style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "unit"]} noStyle>
                    <Input placeholder="Unit" />
                  </Form.Item>
                  <Button size="small" danger onClick={() => remove(name)}>
                    ×
                  </Button>
                </div>
              ))}
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => add({ description: "", targetValue: 0, unit: "count" })}
              >
                Add Key Result
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Drawer>
  );
};

export default GoalFormModal;
