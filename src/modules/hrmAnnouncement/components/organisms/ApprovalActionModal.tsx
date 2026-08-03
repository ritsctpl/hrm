"use client";

import React, { useEffect } from "react";
import { Modal, Form, Input, Alert, Typography } from "antd";
import type { Announcement } from "../../types/domain.types";

const { Text } = Typography;

export type ApprovalAction = "approve" | "reject" | "return";

const COPY: Record<
  ApprovalAction,
  { title: string; ok: string; danger: boolean; remarksRequired: boolean; hint: string }
> = {
  approve: {
    title: "Approve Announcement",
    ok: "Approve",
    danger: false,
    remarksRequired: false,
    hint: "Remarks are optional and recorded in the audit trail.",
  },
  reject: {
    title: "Reject Announcement",
    ok: "Reject",
    danger: true,
    remarksRequired: true,
    hint: "The author is notified with your reason.",
  },
  return: {
    title: "Return for Edit",
    ok: "Return for Edit",
    danger: false,
    remarksRequired: true,
    hint: "The announcement goes back to the author as RETURNED so they can revise and resubmit.",
  },
};

interface ApprovalActionModalProps {
  open: boolean;
  action: ApprovalAction;
  announcement: Announcement | null;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (remarks: string) => void;
}

const ApprovalActionModal: React.FC<ApprovalActionModalProps> = ({
  open,
  action,
  announcement,
  submitting,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm<{ remarks: string }>();
  const copy = COPY[action];

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, action, announcement?.handle, form]);

  const handleOk = async () => {
    const { remarks } = await form.validateFields();
    onConfirm((remarks ?? "").trim());
  };

  return (
    <Modal
      open={open}
      title={copy.title}
      okText={copy.ok}
      okButtonProps={{ danger: copy.danger, loading: submitting }}
      cancelText="Cancel"
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
    >
      <Text strong>&ldquo;{announcement?.title}&rdquo;</Text>

      <Alert type="info" showIcon style={{ margin: "12px 0" }} message={copy.hint} />

      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="remarks"
          label="Remarks"
          rules={
            copy.remarksRequired
              ? [
                  { required: true, message: "Remarks are required for this action" },
                  { whitespace: true, message: "Remarks cannot be blank" },
                  // Server enforces a 10-char minimum; mirror it so the user
                  // finds out here rather than via a 400.
                  { min: 10, message: "Give at least 10 characters" },
                ]
              : [{ max: 500, message: "Remarks must be 500 characters or fewer" }]
          }
        >
          <Input.TextArea rows={3} placeholder={copy.remarksRequired ? "Why?" : "Optional"} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ApprovalActionModal;
