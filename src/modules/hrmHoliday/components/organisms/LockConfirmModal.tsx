'use client';

import { useState } from 'react';
import { Modal, Form, Input, Typography, Button } from 'antd';
import type { LockConfirmModalProps } from '../../types/ui.types';
import { lockFormRules } from '../../utils/validations';
import Can from '../../../hrmAccess/components/Can';

export default function LockConfirmModal({
  open,
  groupName,
  onClose,
  onConfirm,
}: LockConfirmModalProps) {
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
      title="Lock Holiday Group"
      onCancel={onClose}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Can key="lock" I="edit">
          <Button danger type="primary" loading={loading} onClick={handleOk}>
            Lock
          </Button>
        </Can>,
      ]}
    >
      <Typography.Text>
        Locking <strong>{groupName}</strong> will prevent further edits.
        A reason is required.
      </Typography.Text>
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="Reason" name="reason" rules={lockFormRules.reason}>
          <Input.TextArea rows={3} placeholder="Reason for locking..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
