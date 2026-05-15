"use client";

import React, { useState } from "react";
import { Button, Descriptions, Divider, Input, List, Modal, Space, Tag, Typography, message } from "antd";
import {
  CloseCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import LeaveTypeTag from "../atoms/LeaveTypeTag";
import LeaveStatusChip from "../atoms/LeaveStatusChip";
import HalfDayIndicator from "../atoms/HalfDayIndicator";
import ValidationSummaryPanel from "../molecules/ValidationSummaryPanel";
import ActionHistoryTimeline from "../molecules/ActionHistoryTimeline";
import { useEmployeeOptions } from "../../hooks/useEmployeeOptions";
import { useEmployeeIdentity } from "../../../hrmAccess/hooks/useEmployeeIdentity";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { LeaveRequestDetailProps } from "../../types/ui.types";
import type { LeaveAttachment } from "../../types/domain.types";
import { DAY_TYPE_LABELS } from "../../utils/constants";
import styles from "../../styles/HrmLeave.module.css";

const { Title, Text } = Typography;

// Format byte count as a human-readable label.
const formatSize = (bytes?: number): string => {
  if (!bytes || bytes < 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
};

// Pick an icon based on file MIME / extension hint.
const iconForAttachment = (att: { name?: string; contentType?: string }) => {
  const ct = (att.contentType || "").toLowerCase();
  const name = (att.name || "").toLowerCase();
  if (ct.startsWith("image/") || /\.(png|jpe?g|gif|bmp|webp)$/i.test(name)) {
    return <FileImageOutlined />;
  }
  if (ct === "application/pdf" || name.endsWith(".pdf")) {
    return <FilePdfOutlined />;
  }
  return <FileTextOutlined />;
};

// Build a data: URI from an inline base64 payload. Used as a fallback
// when the backend embeds bytes instead of exposing a download URL.
const dataUriFromBase64 = (att: LeaveAttachment): string | null => {
  if (!att.contentBase64) return null;
  if (att.contentBase64.startsWith("data:")) return att.contentBase64;
  const ct = att.contentType || "application/octet-stream";
  return `data:${ct};base64,${att.contentBase64}`;
};

const LeaveRequestDetail: React.FC<LeaveRequestDetailProps> = ({
  request,
  organizationId,
  permissions,
  onApproved,
  onRejected,
  onCancelled,
}) => {
  const { employees } = useEmployeeOptions();
  const identity = useEmployeeIdentity();
  // Track per-attachment in-flight state so the user gets feedback
  // while the authenticated download is being fetched.
  const [busyAttachment, setBusyAttachment] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Cancellation eligibility — per business rule:
  //   - request must be in APPROVED status
  //   - leave start date must be strictly after today (cannot cancel
  //     on or after the leave start date)
  //   - only the requester can cancel their own leave
  const startsInFuture = dayjs(request.startDate).isAfter(dayjs(), "day");
  const isOwnRequest =
    !!identity.employeeCode &&
    (request.employeeId === identity.employeeCode ||
      request.employeeId === identity.employeeIdWithName ||
      (request.employeeId ?? "").startsWith(identity.employeeCode));
  const canCancel =
    request.status === "APPROVED" && startsInFuture && isOwnRequest;

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      message.warning("Please provide a reason for cancellation");
      return;
    }
    if (!identity.isReady || !identity.employeeIdWithName) {
      message.error("Employee identity not resolved yet. Please retry.");
      return;
    }
    setCancelling(true);
    try {
      await HrmLeaveService.cancelLeaveRequest({
        organizationId,
        requestId: request.handle,
        reason: cancelReason.trim(),
        cancelledBy: identity.employeeIdWithName,
      });
      message.success("Leave request cancelled — balance will be restored");
      setCancelOpen(false);
      setCancelReason("");
      onCancelled?.();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message_details?: { error?: string; msg?: string }; message?: string } }; message?: string };
      const backendMsg =
        apiError?.response?.data?.message_details?.msg ||
        apiError?.response?.data?.message_details?.error ||
        apiError?.response?.data?.message ||
        (err instanceof Error ? err.message : null) ||
        "Failed to cancel leave request";
      message.error(backendMsg);
    } finally {
      setCancelling(false);
    }
  };

  /**
   * Fetch the attachment via the authenticated axios instance, then
   * either open it in a new tab (preview) or trigger a save dialog
   * (download). Plain `<a href>` doesn't carry the gateway JWT, so we
   * have to materialise a Blob first.
   */
  const handleAttachmentAction = async (
    att: LeaveAttachment,
    mode: "preview" | "download",
  ) => {
    // Inline base64 payload — no network round-trip needed.
    const inline = dataUriFromBase64(att);
    if (!att.downloadUrl && inline) {
      if (mode === "preview") {
        window.open(inline, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = inline;
        a.download = att.name || "attachment";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      return;
    }
    if (!att.downloadUrl) {
      message.error("Attachment is unavailable — no download URL or content");
      return;
    }
    setBusyAttachment(att.id);
    try {
      const blob = await HrmLeaveService.downloadAttachment(
        att.downloadUrl,
        identity.employeeIdWithName || undefined,
      );
      const blobUrl = URL.createObjectURL(blob);
      if (mode === "preview") {
        window.open(blobUrl, "_blank", "noopener,noreferrer");
        // Revoke after a delay so the new tab has time to load.
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      } else {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = att.name || "attachment";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { status?: number } };
      const status = apiErr?.response?.status;
      if (status === 403) {
        message.error("You do not have permission to download this attachment");
      } else if (status === 404) {
        message.error("Attachment not found on the server");
      } else {
        message.error("Failed to download attachment");
      }
    } finally {
      setBusyAttachment(null);
    }
  };

  // Resolve approver / employee identifier to a readable name. The id
  // is canonically the composite "EMP-2 - Shanmathi M M". When it
  // arrives role-prefixed (e.g. "SUPERVISOR_EMP-2 - Shanmathi M M"),
  // strip the prefix. Bare codes fall back to a directory lookup.
  const resolveEmployeeName = (id: string | undefined): string => {
    if (!id) return "";
    const stripped = id.includes("_") ? id.substring(id.indexOf("_") + 1) : id;
    if (stripped.includes(" - ")) return stripped;
    const match = employees.find((e) => e.employeeCode === stripped);
    return match ? `${match.employeeCode} - ${match.fullName}` : stripped;
  };

  const fromDate = new Date(request.startDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const toDate = new Date(request.endDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const submittedAt = new Date(request.createdDateTime).toLocaleString("en-GB");

  const validationSummary = {
    leaveTypeCode: request.leaveTypeCode,
    requestedUnits: request.totalDays,
    balanceBefore: request.balanceBefore,
    balanceAfter: request.balanceAfter,
    state: "eligible" as const,
    conflictFlags: [],
    messages: [],
    overlaps: [],
  };

  return (
    <div className={styles.requestDetail}>
      <div className={styles.requestDetailHeader}>
        <Title level={5} style={{ margin: 0 }}>
          <LeaveTypeTag code={request.leaveTypeCode} name={request.leaveTypeName} />
        </Title>
        <Space size={8}>
          <LeaveStatusChip status={request.status} />
          {canCancel && (
            <Button
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => setCancelOpen(true)}
            >
              Cancel Request
            </Button>
          )}
        </Space>
      </div>
      {request.status === "APPROVED" && !startsInFuture && isOwnRequest && (
        <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
          Cancellation window has closed — leave start date has been reached.
        </Text>
      )}

      <Text type="secondary" style={{ fontSize: 12 }}>
        Submitted: {submittedAt}
      </Text>

      <Divider style={{ margin: "12px 0" }} />

      <Descriptions size="small" column={1} bordered>
        <Descriptions.Item label="Employee">{request.employeeName || resolveEmployeeName(request.employeeId)}</Descriptions.Item>
        <Descriptions.Item label="Leave Type">
          <LeaveTypeTag code={request.leaveTypeCode} name={request.leaveTypeName} />
        </Descriptions.Item>
        <Descriptions.Item label="From">
          {fromDate}{" "}
          <HalfDayIndicator dayType={request.startDayType} />
          <Text type="secondary" style={{ fontSize: 11 }}>
            ({DAY_TYPE_LABELS[request.startDayType]})
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="To">
          {toDate}{" "}
          <HalfDayIndicator dayType={request.endDayType} />
          <Text type="secondary" style={{ fontSize: 11 }}>
            ({DAY_TYPE_LABELS[request.endDayType]})
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Total Days">{request.totalDays.toFixed(1)} days</Descriptions.Item>
        <Descriptions.Item label="Reason">{request.reason}</Descriptions.Item>
        {request.currentApproverId && (
          <Descriptions.Item label="Current Approver">{resolveEmployeeName(request.currentApproverId)}</Descriptions.Item>
        )}
        {request.slaDeadline && (
          <Descriptions.Item label="SLA Deadline">
            {new Date(request.slaDeadline).toLocaleString("en-GB")}
            {request.slaBreached && (
              <Text type="danger" style={{ marginLeft: 8 }}>(Breached)</Text>
            )}
          </Descriptions.Item>
        )}
      </Descriptions>

      {(() => {
        // Build a unified view of attachments combining the new
        // multi-attachment array and the legacy single attachmentPath
        // field so older requests still render.
        const items: LeaveAttachment[] = [...(request.attachments ?? [])];
        if (request.attachmentPath && items.length === 0) {
          items.push({
            id: "legacy-0",
            name: request.attachmentPath.split(/[\\/]/).pop() || "Attachment",
            downloadUrl: request.attachmentPath,
          });
        }
        if (items.length === 0) return null;

        return (
          <>
            <Divider style={{ margin: "12px 0" }} />
            <Title level={5}>
              <Space size={6}>
                <PaperClipOutlined />
                Supporting Documents
                <Tag>{items.length}</Tag>
              </Space>
            </Title>
            <List
              size="small"
              bordered
              dataSource={items}
              renderItem={(att) => {
                const reachable = !!(att.downloadUrl || att.contentBase64);
                const sizeLabel = formatSize(att.sizeBytes);
                const isBusy = busyAttachment === att.id;
                return (
                  <List.Item
                    actions={[
                      reachable ? (
                        <Button
                          key="view"
                          type="link"
                          size="small"
                          icon={<EyeOutlined />}
                          loading={isBusy}
                          onClick={() => handleAttachmentAction(att, "preview")}
                        >
                          View
                        </Button>
                      ) : (
                        <Text key="view" type="secondary" style={{ fontSize: 12 }}>
                          No download URL
                        </Text>
                      ),
                      reachable ? (
                        <Button
                          key="download"
                          type="link"
                          size="small"
                          icon={<DownloadOutlined />}
                          loading={isBusy}
                          onClick={() => handleAttachmentAction(att, "download")}
                        >
                          Download
                        </Button>
                      ) : null,
                    ].filter(Boolean) as React.ReactNode[]}
                  >
                    <Space size={8}>
                      {iconForAttachment(att)}
                      <div>
                        <Text strong style={{ fontSize: 13 }}>
                          {att.name}
                        </Text>
                        {(sizeLabel || att.contentType || att.uploadedBy || att.uploadedAt) && (
                          <>
                            <br />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {[
                                att.contentType,
                                sizeLabel,
                                att.uploadedBy,
                                att.uploadedAt
                                  ? new Date(att.uploadedAt).toLocaleString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </Text>
                          </>
                        )}
                      </div>
                    </Space>
                  </List.Item>
                );
              }}
            />
          </>
        );
      })()}

      <Divider style={{ margin: "12px 0" }} />
      <Title level={5}>Validation Summary</Title>
      <ValidationSummaryPanel summary={validationSummary} />

      <Divider style={{ margin: "12px 0" }} />
      <Title level={5}>Action History</Title>
      <ActionHistoryTimeline actions={request.actionHistory} />

      <Modal
        title="Cancel Leave Request"
        open={cancelOpen}
        onCancel={() => {
          setCancelOpen(false);
          setCancelReason("");
        }}
        onOk={handleCancel}
        okText="Confirm Cancellation"
        okButtonProps={{ danger: true, loading: cancelling }}
        destroyOnHidden
      >
        <Text>
          Cancel this approved leave request? The leave balance will be restored
          automatically upon cancellation.
        </Text>
        <Input.TextArea
          rows={3}
          placeholder="Reason for cancellation (required)"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          maxLength={500}
          showCount
          style={{ marginTop: 12 }}
        />
      </Modal>
    </div>
  );
};

export default LeaveRequestDetail;
