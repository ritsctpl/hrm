"use client";

import React from "react";
import { Button, Descriptions, Divider, List, Space, Tag, Typography } from "antd";
import {
  DownloadOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import LeaveTypeTag from "../atoms/LeaveTypeTag";
import LeaveStatusChip from "../atoms/LeaveStatusChip";
import HalfDayIndicator from "../atoms/HalfDayIndicator";
import ValidationSummaryPanel from "../molecules/ValidationSummaryPanel";
import ActionHistoryTimeline from "../molecules/ActionHistoryTimeline";
import { useEmployeeOptions } from "../../hooks/useEmployeeOptions";
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

// Resolve a downloadable href for an attachment. Prefers a backend URL,
// falls back to a base64 data URI, otherwise returns null (rendered as
// a non-clickable label).
const hrefForAttachment = (att: LeaveAttachment): string | null => {
  if (att.downloadUrl) return att.downloadUrl;
  if (att.contentBase64) {
    // contentBase64 may already include the data: prefix from
    // FileReader.readAsDataURL; only prepend when it doesn't.
    if (att.contentBase64.startsWith("data:")) return att.contentBase64;
    const ct = att.contentType || "application/octet-stream";
    return `data:${ct};base64,${att.contentBase64}`;
  }
  return null;
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
        <LeaveStatusChip status={request.status} />
      </div>

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
                const href = hrefForAttachment(att);
                const sizeLabel = formatSize(att.sizeBytes);
                return (
                  <List.Item
                    actions={[
                      href ? (
                        <Button
                          key="view"
                          type="link"
                          size="small"
                          icon={<EyeOutlined />}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </Button>
                      ) : (
                        <Text key="view" type="secondary" style={{ fontSize: 12 }}>
                          No download URL
                        </Text>
                      ),
                      href ? (
                        <Button
                          key="download"
                          type="link"
                          size="small"
                          icon={<DownloadOutlined />}
                          href={href}
                          download={att.name}
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
                        {(sizeLabel || att.contentType) && (
                          <>
                            <br />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {[att.contentType, sizeLabel].filter(Boolean).join(" · ")}
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
    </div>
  );
};

export default LeaveRequestDetail;
