"use client";

import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Alert, Checkbox, Typography } from "antd";

const { Text } = Typography;
const CONFIRM_WORD = "PUBLISH";

interface EmergencyPublishModalProps {
  open: boolean;
  title: string;
  /** Ratification window in hours; the server default is 24. */
  ratificationHours?: number;
  publishing: boolean;
  onCancel: () => void;
  onConfirm: (justification: string) => void;
}

interface EmergencyForm {
  justification: string;
  confirmWord: string;
  genuine: boolean;
}

/**
 * Emergency publish confirmation (screen.md §7.4).
 *
 * Deliberately high-friction: this bypasses approval entirely and mails the
 * whole audience immediately. Typed confirmation + explicit checkbox, because
 * a single misclick here is not recallable — the emails have gone.
 */
const EmergencyPublishModal: React.FC<EmergencyPublishModalProps> = ({
  open,
  title,
  ratificationHours = 24,
  publishing,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm<EmergencyForm>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setReady(false);
    }
  }, [open, form]);

  // Both gates must pass before the danger button unlocks.
  const revalidate = () => {
    const v = form.getFieldsValue();
    setReady(v.confirmWord?.trim().toUpperCase() === CONFIRM_WORD && !!v.genuine);
  };

  const handleOk = async () => {
    const v = await form.validateFields();
    onConfirm(v.justification.trim());
  };

  return (
    <Modal
      open={open}
      title="⚠ Emergency Announcement — publishes immediately"
      okText="Publish Emergency"
      okButtonProps={{ danger: true, disabled: !ready, loading: publishing }}
      cancelText="Cancel"
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
      width={560}
    >
      <Alert
        type="error"
        showIcon
        style={{ marginBottom: 12 }}
        message={`"${title}" will be sent now.`}
        description={
          <>
            This bypasses approval and emails the full audience immediately.
            HR will be notified and must ratify within {ratificationHours} hours.
            If ratification is refused the announcement is withdrawn — but{" "}
            <Text strong>the emails already sent stay sent.</Text> This action is recorded
            against your user ID.
          </>
        }
      />

      <Form form={form} layout="vertical" preserve={false} onValuesChange={revalidate}>
        <Form.Item
          name="justification"
          label="Justification"
          rules={[
            { required: true, message: "A justification is required" },
            { whitespace: true, message: "Justification cannot be blank" },
            { min: 10, message: "Give at least 10 characters of context" },
          ]}
        >
          <Input.TextArea rows={3} placeholder="e.g. Site evacuation — fire alarm at Bengaluru office" />
        </Form.Item>

        <Form.Item
          name="confirmWord"
          label={`Type ${CONFIRM_WORD} to confirm`}
          rules={[
            {
              validator: (_, value) =>
                value?.trim().toUpperCase() === CONFIRM_WORD
                  ? Promise.resolve()
                  : Promise.reject(new Error(`Type ${CONFIRM_WORD} exactly`)),
            },
          ]}
        >
          <Input autoComplete="off" placeholder={CONFIRM_WORD} />
        </Form.Item>

        <Form.Item
          name="genuine"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value ? Promise.resolve() : Promise.reject(new Error("Please confirm")),
            },
          ]}
        >
          <Checkbox>I confirm this is a genuine emergency.</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EmergencyPublishModal;
