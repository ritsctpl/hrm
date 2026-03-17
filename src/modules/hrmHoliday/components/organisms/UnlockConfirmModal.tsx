'use client';

import { useState } from 'react';
import { Modal, Form, Input, Typography, Alert } from 'antd';
import type { UnlockConfirmModalProps } from '../../types/ui.types';
import { lockFormRules } from '../../utils/validations';

export default function UnlockConfirmModal({
  open,
  groupName,
  onClose,
  onConfirm,
}: UnlockConfirmModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onConfirm(values.reason);
    } finally {
      setLoading(false);
      form.resetFields();
    }
  };

  return (
    <Modal
      open={open}
      title="Unlock Holiday Group (Superadmin Override)"
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Unlock"
      okButtonProps={{ danger: true }}
      destroyOnHidden
    >
      <Alert
        message="This is a Superadmin action"
        description="Unlocking allows edits on a locked group. A mandatory reason is required."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Typography.Text>
        Unlock <strong>{groupName}</strong>?
      </Typography.Text>
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="Reason" name="reason" rules={lockFormRules.reason}>
          <Input.TextArea rows={3} placeholder="Reason for unlocking..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
