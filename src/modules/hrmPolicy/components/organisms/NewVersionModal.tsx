"use client";

/**
 * NewVersionModal — manually revise a policy to the next version.
 * Wires the backend `uploadNewVersion` endpoint: the user enters the NEW version number
 * (and optionally a new PDF + change note); the current version is archived as SUPERSEDED
 * and the new number becomes the active version (document returns to DRAFT for re-approval).
 */

import React from "react";
import { Modal, Form, Input, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { parseCookies } from "nookies";
import { HrmPolicyService } from "../../services/hrmPolicyService";
import type { PolicyDocument } from "../../types/domain.types";

interface NewVersionModalProps {
  open: boolean;
  policy: PolicyDocument | null;
  organizationId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const NewVersionModal: React.FC<NewVersionModalProps> = ({
  open,
  policy,
  organizationId,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = React.useState(false);
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [fileList, setFileList] = React.useState<UploadFile[]>([]);

  React.useEffect(() => {
    if (open) {
      form.resetFields();
      setPdfFile(null);
      setFileList([]);
    }
  }, [open, policy, form]);

  const handleSubmit = async () => {
    if (!policy) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      const uploadedBy = parseCookies().userId ?? "system";
      await HrmPolicyService.uploadNewVersion(
        organizationId,
        policy.handle,
        values.newVersionNumber,
        values.changeDescription ?? "",
        uploadedBy,
        pdfFile ?? undefined,
      );
      message.success(
        `New version ${values.newVersionNumber} created — the previous version is now superseded.`,
      );
      onSuccess();
      onClose();
    } catch {
      message.error("Failed to create new version");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="New Version"
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Create Version"
      confirmLoading={saving}
      destroyOnClose
    >
      <p style={{ color: "#8c8c8c", marginTop: 0 }}>
        Creating a new version archives the current version as <strong>SUPERSEDED</strong> and makes
        the new number the active version. The document returns to <strong>DRAFT</strong> for re-approval.
      </p>
      <Form form={form} layout="vertical">
        <Form.Item label="Current Version">
          <Input value={policy?.currentVersion ?? "-"} disabled />
        </Form.Item>
        <Form.Item
          name="newVersionNumber"
          label="New Version"
          rules={[
            { required: true, message: "Please enter the new version (e.g. 2.0)" },
            { pattern: /^\d+(\.\d+)*$/, message: "Use a numeric version like 2.0 or 2.1" },
          ]}
        >
          <Input placeholder="e.g. 2.0" />
        </Form.Item>
        <Form.Item name="changeDescription" label="Change Description">
          <Input.TextArea rows={3} placeholder="What changed in this version?" />
        </Form.Item>
        <Form.Item label="New PDF (optional)">
          <Upload
            beforeUpload={(f) => {
              setPdfFile(f as File);
              setFileList([{ uid: "-1", name: (f as File).name, status: "done" }]);
              return false;
            }}
            onRemove={() => {
              setPdfFile(null);
              setFileList([]);
            }}
            maxCount={1}
            accept=".pdf"
            fileList={fileList}
          >
            <Button icon={<UploadOutlined />}>Upload PDF</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NewVersionModal;
