"use client";

import React, { useState } from "react";
import { Modal, Form, Select, message, Space, Typography, Alert, Button } from "antd";
import { SwapOutlined } from "@ant-design/icons";
import { PolicyDocument } from "../../types/domain.types";
import Can from "../../../hrmAccess/components/Can";

const { Option } = Select;

interface SupersedePolicyModalProps {
  open: boolean;
  policies: PolicyDocument[];
  site: string;
  onClose: () => void;
  onSupersede: (oldPolicyHandle: string, newPolicyHandle: string) => Promise<void>;
}

const SupersedePolicyModal: React.FC<SupersedePolicyModalProps> = ({
  open,
  policies,
  site,
  onClose,
  onSupersede,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [oldPolicyHandle, setOldPolicyHandle] = useState<string>("");
  const [newPolicyHandle, setNewPolicyHandle] = useState<string>("");

  // Don't render anything when modal is closed — avoids useForm warning
  if (!open) return null;

  const publishedPolicies = policies.filter(p => p.status === "PUBLISHED");
  const availableNewPolicies = policies.filter(p => p.status === "PUBLISHED" && p.handle !== oldPolicyHandle);

  const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (oldPolicyHandle === newPolicyHandle) {
        message.error("Old and new policy cannot be the same");
        return;
      }

      setLoading(true);
      await onSupersede(oldPolicyHandle, newPolicyHandle);
      onClose();
    } catch (error) {
      // validation error — form handles display
    } finally {
      setLoading(false);
    }
  };

  const oldPolicy = policies.find(p => p.handle === oldPolicyHandle);
  const newPolicy = policies.find(p => p.handle === newPolicyHandle);

  return (
    <Modal
      title={
        <Space>
          <SwapOutlined />
          <span>Supersede Policy</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Can key="ok" I="edit">
          <Button type="primary" danger loading={loading} onClick={handleSubmit}>
            Supersede Policy
          </Button>
        </Can>,
      ]}
    >
      <Alert
        message="What is Policy Supersession?"
        description="Superseding a policy marks the old PUBLISHED policy as SUPERSEDED and links it to a new PUBLISHED policy. The old policy will no longer be active."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical">
        <Form.Item
          name="oldPolicyHandle"
          label="Old Policy (to be superseded)"
          rules={[{ required: true, message: "Please select the old policy" }]}
          extra="Only PUBLISHED policies can be superseded"
        >
          <Select
            placeholder="Select PUBLISHED policy to supersede"
            showSearch
            optionFilterProp="children"
            onChange={(value) => setOldPolicyHandle(value)}
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {publishedPolicies.map((policy) => (
              <Option key={policy.handle} value={policy.handle}>
                {policy.policyCode} - {policy.title}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {oldPolicy && (
          <div style={{ marginBottom: 16, padding: 12, background: "#fff1f0", borderRadius: 4 }}>
            <Typography.Text type="secondary" strong>Old Policy Details:</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <div><strong>Code:</strong> {oldPolicy.policyCode}</div>
              <div><strong>Title:</strong> {oldPolicy.title}</div>
              <div><strong>Version:</strong> {oldPolicy.currentVersion}</div>
            </div>
          </div>
        )}

        <Form.Item
          name="newPolicyHandle"
          label="New Policy (replacement)"
          rules={[{ required: true, message: "Please select the new policy" }]}
          extra="Only PUBLISHED policies (excluding selected old policy) can be used"
        >
          <Select
            placeholder="Select PUBLISHED replacement policy"
            showSearch
            optionFilterProp="children"
            onChange={(value) => setNewPolicyHandle(value)}
            disabled={!oldPolicyHandle}
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {availableNewPolicies.map((policy) => (
              <Option key={policy.handle} value={policy.handle}>
                {policy.policyCode} - {policy.title}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {newPolicy && (
          <div style={{ marginBottom: 16, padding: 12, background: "#f6ffed", borderRadius: 4 }}>
            <Typography.Text type="secondary" strong>New Policy Details:</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <div><strong>Code:</strong> {newPolicy.policyCode}</div>
              <div><strong>Title:</strong> {newPolicy.title}</div>
              <div><strong>Version:</strong> {newPolicy.currentVersion}</div>
            </div>
          </div>
        )}
      </Form>

      {oldPolicyHandle && newPolicyHandle && (
        <Alert
          message="Confirmation Required"
          description={`This will mark "${oldPolicy?.title}" as SUPERSEDED and link it to "${newPolicy?.title}". This action cannot be undone.`}
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Modal>
  );
};

export default SupersedePolicyModal;
