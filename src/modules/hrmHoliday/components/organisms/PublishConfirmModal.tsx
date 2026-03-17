'use client';

import { useState } from 'react';
import { Modal, Input, Typography, Space } from 'antd';
import type { PublishConfirmModalProps } from '../../types/ui.types';

export default function PublishConfirmModal({
  open,
  groupName,
  onClose,
  onConfirm,
}: PublishConfirmModalProps) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    setLoading(true);
    try {
      await onConfirm(comment || undefined);
    } finally {
      setLoading(false);
      setComment('');
    }
  };

  return (
    <Modal
      open={open}
      title="Publish Holiday Group"
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Publish"
      okButtonProps={{ type: 'primary' }}
      destroyOnHidden
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Typography.Text>
          Are you sure you want to publish <strong>{groupName}</strong>?
          Once published, employees will be able to see these holidays.
        </Typography.Text>
        <Input.TextArea
          rows={2}
          placeholder="Optional comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Space>
    </Modal>
  );
}
