"use client";

import React, { useEffect } from "react";
import { Modal, Form, Input, Typography, Alert } from "antd";
import { Announcement } from "../../types/domain.types";

const { Text } = Typography;

interface WithdrawConfirmModalProps {
  open: boolean;
  announcement: Announcement | null;
  confirming: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

interface WithdrawForm {
  reason: string;
}

/**
 * Withdraw confirmation (design §14.2.1). The reason is required — it lands in
 * the audit trail, so a blank one makes the trail useless. The read-count
 * warning is what stops someone withdrawing an announcement the whole company
 * has already seen without realising it.
 */
const WithdrawConfirmModal: React.FC<WithdrawConfirmModalProps> = ({
  open,
  announcement,
  confirming,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm<WithdrawForm>();

  // Clear the previous reason whenever the modal reopens for another record.
  useEffect(() => {
    if (open) form.resetFields();
  }, [open, announcement?.handle, form]);

  const handleOk = async () => {
    const { reason } = await form.validateFields();
    onConfirm(reason.trim());
  };

  const readCount = announcement?.readCount ?? 0;

  return (
    <Modal
      open={open}
      title="Withdraw Announcement"
      okText="Withdraw Announcement"
      okButtonProps={{ danger: true, loading: confirming }}
      cancelText="Cancel"
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
    >
      <Text>
        Withdraw <Text strong>&ldquo;{announcement?.title}&rdquo;</Text>?
      </Text>

      <Alert
        type="warning"
        showIcon
        style={{ margin: "12px 0" }}
        message="This will hide the announcement from all employee feeds."
        description={
          readCount > 0
            ? `${readCount} employee${readCount === 1 ? " has" : "s have"} already read it.`
            : undefined
        }
      />

      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="reason"
          label="Reason"
          rules={[
            { required: true, message: "A reason is required — it is recorded in the audit trail" },
            { whitespace: true, message: "Reason cannot be blank" },
            { max: 300, message: "Reason must be 300 characters or fewer" },
          ]}
        >
          <Input.TextArea rows={3} placeholder="Why is this being withdrawn?" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default WithdrawConfirmModal;
