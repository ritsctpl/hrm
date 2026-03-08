"use client";

import React, { useEffect } from "react";
import { Drawer, Form, Input, Select, DatePicker, Button, Space, message } from "antd";
import dayjs from "dayjs";
import { PolicyFormDrawerProps } from "../../types/ui.types";
import { HrmPolicyService } from "../../services/hrmPolicyService";
import { POLICY_DOC_TYPE_LABELS } from "../../utils/constants";
import { useHrmPolicyStore } from "../../stores/hrmPolicyStore";

const { Option } = Select;
const { TextArea } = Input;

const PolicyFormDrawer: React.FC<PolicyFormDrawerProps> = ({
  open,
  editPolicy,
  categories,
  site,
  onClose,
  onSaved,
}) => {
  const [form] = Form.useForm();
  const { saving, setSaving } = useHrmPolicyStore();

  useEffect(() => {
    if (open) {
      if (editPolicy) {
        form.setFieldsValue({
          title: editPolicy.title,
          documentType: editPolicy.documentType,
          categoryHandle: editPolicy.categoryHandle,
          description: editPolicy.description,
          textContent: editPolicy.textContent,
          effectiveFrom: editPolicy.effectiveFrom ? dayjs(editPolicy.effectiveFrom) : undefined,
          reviewDate: editPolicy.reviewDate ? dayjs(editPolicy.reviewDate) : undefined,
          tags: editPolicy.tags,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editPolicy, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        ...values,
        site,
        effectiveFrom: values.effectiveFrom?.format("YYYY-MM-DD"),
        reviewDate: values.reviewDate?.format("YYYY-MM-DD"),
      };
      if (editPolicy) {
        await HrmPolicyService.updatePolicy({ ...payload, policyHandle: editPolicy.handle });
      } else {
        await HrmPolicyService.createPolicy(payload);
      }
      message.success(editPolicy ? "Policy updated" : "Policy created");
      onSaved();
    } catch {
      message.error("Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={editPolicy ? "Edit Policy" : "New Policy"}
      open={open}
      onClose={onClose}
      width={600}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={saving}>
            {editPolicy ? "Update" : "Create"}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input placeholder="Policy title" />
        </Form.Item>
        <Form.Item name="documentType" label="Document Type" rules={[{ required: true }]}>
          <Select placeholder="Select type">
            {Object.entries(POLICY_DOC_TYPE_LABELS).map(([value, label]) => (
              <Option key={value} value={value}>{label}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="categoryHandle" label="Category" rules={[{ required: true }]}>
          <Select placeholder="Select category">
            {categories.map((cat) => (
              <Option key={cat.handle} value={cat.handle}>{cat.categoryName}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="description" label="Summary">
          <TextArea rows={2} placeholder="Brief summary of this policy" />
        </Form.Item>
        <Form.Item name="textContent" label="Content">
          <TextArea rows={6} placeholder="Policy content (HTML supported)" />
        </Form.Item>
        <Form.Item name="effectiveFrom" label="Effective Date" rules={[{ required: true }]}>
          <DatePicker style={{ width: "100%" }} format="DD-MMM-YYYY" />
        </Form.Item>
        <Form.Item name="reviewDate" label="Next Review Date">
          <DatePicker style={{ width: "100%" }} format="DD-MMM-YYYY" />
        </Form.Item>
        <Form.Item name="tags" label="Tags">
          <Select mode="tags" placeholder="Add tags" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default PolicyFormDrawer;
