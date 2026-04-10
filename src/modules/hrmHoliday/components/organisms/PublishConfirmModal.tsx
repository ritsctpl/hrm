'use client';

import { useState } from 'react';
import { Modal, Input, Typography, Space, Button } from 'antd';
import type { PublishConfirmModalProps } from '../../types/ui.types';
import Can from '../../../hrmAccess/components/Can';

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
      onCancel={onClose}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Can key="publish" I="edit">
          <Button type="primary" loading={loading} onClick={handleOk}>
            Publish
          </Button>
        </Can>,
      ]}
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
