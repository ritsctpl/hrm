"use client";

import React, { useEffect } from "react";
import { Modal, Form, Input, Alert, Typography } from "antd";
import type { Announcement } from "../../types/domain.types";

const { Text } = Typography;

interface RatifyConfirmModalProps {
  open: boolean;
  /** true = ratify, false = refuse. */
  ratifying: boolean;
  announcement: Announcement | null;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (remarks: string) => void;
}

/**
 * Ratify / refuse confirmation (handover §4.2).
 *
 * Refusal must not read as a recall. It withdraws the announcement from feeds,
 * but every email already sent stays sent — the dialog says so plainly rather
 * than letting someone assume the message can be unsent.
 */
const RatifyConfirmModal: React.FC<RatifyConfirmModalProps> = ({
  open,
  ratifying,
  announcement,
  submitting,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm<{ remarks: string }>();

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, ratifying, announcement?.handle, form]);

  const handleOk = async () => {
    const { remarks } = await form.validateFields();
    onConfirm((remarks ?? "").trim());
  };

  return (
    <Modal
      open={open}
      title={ratifying ? "Ratify Emergency Publish" : "Refuse Ratification"}
      okText={ratifying ? "Ratify" : "Refuse and Withdraw"}
      okButtonProps={{ danger: !ratifying, loading: submitting }}
      cancelText="Cancel"
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
    >
      <Text>
        <Text strong>&ldquo;{announcement?.title}&rdquo;</Text>
      </Text>

      <Alert
        type={ratifying ? "info" : "error"}
        showIcon
        style={{ margin: "12px 0" }}
        message={
          ratifying
            ? "Confirms the emergency publish was justified."
            : "This withdraws the announcement from all employee feeds."
        }
        description={
          ratifying ? (
            "The announcement stays published and the ratification is recorded against your user ID."
          ) : (
            <>
              The emails that already went out <Text strong>cannot be recalled</Text> — they
              remain in recipients&rsquo; inboxes. Only the in-app announcement is withdrawn,
              and the refusal is recorded with your reason.
            </>
          )
        }
      />

      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="remarks"
          label="Remarks"
          rules={
            ratifying
              ? [{ max: 500, message: "Remarks must be 500 characters or fewer" }]
              : [
                  { required: true, message: "A reason is required to refuse" },
                  { whitespace: true, message: "Reason cannot be blank" },
                  { min: 10, message: "Give at least 10 characters" },
                ]
          }
        >
          <Input.TextArea
            rows={3}
            placeholder={ratifying ? "Optional" : "Why is this being refused?"}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RatifyConfirmModal;
