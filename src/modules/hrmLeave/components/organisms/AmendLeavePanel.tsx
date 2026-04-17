"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Typography,
  Upload,
  message,
} from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import dayjs from "dayjs";
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { LeaveRequest } from "../../types/domain.types";
import styles from "../../styles/HrmLeaveForm.module.css";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

interface AmendLeavePanelProps {
  open: boolean;
  organizationId: string;
  request: LeaveRequest | null;
  onClose: () => void;
  onAmended?: (updated: LeaveRequest) => void;
}

const AmendLeavePanel: React.FC<AmendLeavePanelProps> = ({
  open,
  organizationId,
  request,
  onClose,
  onAmended,
}) => {
  const cookies = parseCookies();
  const userId = cookies.userId ?? "";
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<
    { name: string; base64: string }[]
  >([]);

  useEffect(() => {
    if (open && request) {
      form.setFieldsValue({
        range: [dayjs(request.startDate), dayjs(request.endDate)],
        reason: request.reason,
      });
      setAttachments([]);
    }
    if (!open) {
      form.resetFields();
      setAttachments([]);
    }
  }, [open, request, form]);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });

  const handleAttachmentUpload = async (file: File) => {
    const isAllowed =
      file.type.startsWith("image/") || file.type === "application/pdf";
    if (!isAllowed) {
      message.error("Only image or PDF files are allowed");
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("File must be smaller than 5MB");
      return false;
    }
    try {
      const base64 = await fileToBase64(file);
      setAttachments((prev) => [...prev, { name: file.name, base64 }]);
      message.success(`${file.name} attached`);
    } catch {
      message.error("Failed to read file");
    }
    return false;
  };

  const removeAttachment = (name: string) => {
    setAttachments((prev) => prev.filter((a) => a.name !== name));
  };

  const attachmentFileList: UploadFile[] = attachments.map((a, idx) => ({
    uid: `${idx}`,
    name: a.name,
    status: "done",
  }));

  const handleSubmit = async () => {
    if (!request) return;
    try {
      const values = await form.validateFields();
      const [start, end] = values.range as [dayjs.Dayjs, dayjs.Dayjs];
      const totalDays = end.diff(start, "day") + 1;
      setSubmitting(true);
      const payload = {
        organizationId,
        handle: request.handle,
        startDate: start.format("YYYY-MM-DD"),
        endDate: end.format("YYYY-MM-DD"),
        startDayType: request.startDayType,
        endDayType: request.endDayType,
        totalDays,
        reason: values.reason,
        amendedBy: userId,
        attachments: attachments.map((a) => a.base64),
      } as Parameters<typeof HrmLeaveService.amendLeaveRequest>[0];
      const updated = await HrmLeaveService.amendLeaveRequest(payload);
      message.success("Leave request amended");
      onAmended?.(updated);
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error("Failed to amend leave request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title="Amend Leave Request"
      open={open}
      onClose={onClose}
      width={520}
      footer={
        <div className={styles.formActions}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={submitting}>
            Save Changes
          </Button>
        </div>
      }
    >
      {request && (
        <>
          <Title level={5} style={{ marginTop: 0 }}>
            {request.leaveTypeName}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Current status: {request.status}
          </Text>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="range"
              label="Dates"
              rules={[{ required: true, message: "Select date range" }]}
            >
              <RangePicker format="DD-MMM-YYYY" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="reason"
              label="Reason"
              rules={[{ required: true, message: "Reason is required" }]}
            >
              <Input.TextArea rows={4} placeholder="Updated reason for leave" />
            </Form.Item>
            <Form.Item label="Supporting Documents">
              <Upload
                accept="image/*,application/pdf"
                beforeUpload={handleAttachmentUpload}
                fileList={attachmentFileList}
                showUploadList={false}
                multiple
              >
                <Button icon={<UploadOutlined />}>Attach File</Button>
              </Upload>
              <Text
                type="secondary"
                style={{ fontSize: 11, display: "block", marginTop: 4 }}
              >
                Image or PDF, max 5MB each
              </Text>
              {attachments.length > 0 && (
                <ul
                  style={{
                    marginTop: 8,
                    paddingLeft: 0,
                    listStyle: "none",
                  }}
                >
                  {attachments.map((a) => (
                    <li
                      key={a.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "4px 8px",
                        background: "#fafafa",
                        borderRadius: 4,
                        marginBottom: 4,
                        fontSize: 12,
                      }}
                    >
                      <span>{a.name}</span>
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeAttachment(a.name)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Form.Item>
          </Form>
        </>
      )}
    </Drawer>
  );
};

export default AmendLeavePanel;
