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
import { DeleteOutlined, DownloadOutlined, EyeOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import dayjs from "dayjs";
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { useEmployeeIdentity } from "../../../hrmAccess/hooks/useEmployeeIdentity";
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
  const identity = useEmployeeIdentity();
  // Leave service expects composite "EMP0012 - John Doe" for modifiedBy.
  const userId = identity.employeeIdWithName || cookies.userId || "";
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  // Attachment item — covers both files already on the request being amended
  // (`existing: true`, carries `url` / `id`) and freshly uploaded ones
  // (`existing: false`, carries `base64`). View / Download work for both.
  type AmendAttachment = {
    uid: string;
    name: string;
    contentType: string;
    base64?: string;
    url?: string;
    existing: boolean;
    id?: string;
  };
  const [attachments, setAttachments] = useState<AmendAttachment[]>([]);

  // Seed attachments from a LeaveRequest's `attachments` array. Defined here
  // so both the prop fallback and the retrieved-detail effect share the
  // same mapping.
  const seedAttachmentsFrom = React.useCallback((rq: LeaveRequest | null | undefined) => {
    setAttachments(
      (rq?.attachments ?? []).map((a, i) => ({
        uid: a.id || `existing-${i}`,
        name: a.name,
        contentType: a.contentType || "application/octet-stream",
        base64: a.contentBase64,
        url: a.downloadUrl,
        existing: true,
        id: a.id,
      })),
    );
  }, []);

  useEffect(() => {
    if (open && request) {
      form.setFieldsValue({
        range: [dayjs(request.startDate), dayjs(request.endDate)],
        reason: request.reason,
      });
      // First-pass seed from the prop so the list isn't blank while the
      // detail call is in flight. The retrieve effect below overrides
      // this with the authoritative attachments from /leave-request/retrieve.
      seedAttachmentsFrom(request);
    }
    if (!open) {
      form.resetFields();
      setAttachments([]);
    }
  }, [open, request, form, seedAttachmentsFrom]);

  // /my-requests often returns a truncated row without the `attachments`
  // array populated — the previously-uploaded files would then never render
  // in the Amend drawer. Always re-fetch the full request on open so the
  // existing attachments load automatically, complete with their downloadUrl.
  useEffect(() => {
    if (!open || !request?.handle || !organizationId) return;
    let cancelled = false;
    setLoadingDetail(true);
    HrmLeaveService.getLeaveRequestById({
      organizationId,
      id: request.handle,
    })
      .then((detail) => {
        if (!cancelled && detail) {
          seedAttachmentsFrom(detail);
        }
      })
      .catch(() => {
        // Silent — the prop-based seed (above) is still in place so the user
        // can at least see whatever the list row carried.
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, request?.handle, organizationId, seedAttachmentsFrom]);

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
      // Amend is a "replace the supporting document" flow — a fresh upload
      // takes over the slot so the user sees the new file (with View /
      // Download) instead of an ever-growing list. Existing attachments are
      // discarded on a new upload, mirroring "Allow replacing old attachment
      // with new uploaded file" in the requirements.
      setAttachments([
        {
          uid: `new-${Date.now()}-${file.name}`,
          name: file.name,
          base64,
          contentType: file.type || "application/octet-stream",
          existing: false,
        },
      ]);
      message.success(`${file.name} attached`);
    } catch {
      message.error("Failed to read file");
    }
    return false;
  };

  const removeAttachment = (uid: string) => {
    setAttachments((prev) => prev.filter((a) => a.uid !== uid));
  };

  // View / Download use the BE-supplied URL when available (existing files)
  // and fall back to the in-memory base64 data URI (newly uploaded files) so
  // the file is usable the instant it is added — no save+reload needed.
  const hrefFor = (a: AmendAttachment): string => a.url || a.base64 || "";
  const viewAttachment = (a: AmendAttachment) => {
    const href = hrefFor(a);
    if (!href) return;
    window.open(href, "_blank", "noopener,noreferrer");
  };
  const downloadAttachment = (a: AmendAttachment) => {
    const href = hrefFor(a);
    if (!href) return;
    const link = document.createElement("a");
    link.href = href;
    link.download = a.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        // Only send attachments when there is fresh file content to send
        // (newly uploaded files carry base64). Existing files without base64
        // would be silently dropped by the BE's "non-empty list replaces"
        // contract, so we omit the field and let the BE keep them intact —
        // matching the apply-leave drawer.
        ...((() => {
          const uploads = attachments
            .filter((a) => !!a.base64)
            .map((a) => ({
              name: a.name,
              contentType: a.contentType,
              contentBase64: a.base64 as string,
            }));
          return uploads.length > 0 ? { attachments: uploads } : {};
        })()),
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
                      key={a.uid}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 4,
                        padding: "4px 8px",
                        background: "#fafafa",
                        borderRadius: 4,
                        marginBottom: 4,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.name}
                      </span>
                      {a.existing && (
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 4, marginRight: 4 }}>
                          saved
                        </Text>
                      )}
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => viewAttachment(a)}
                        disabled={!hrefFor(a)}
                      >
                        View
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => downloadAttachment(a)}
                        disabled={!hrefFor(a)}
                      >
                        Download
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeAttachment(a.uid)}
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
