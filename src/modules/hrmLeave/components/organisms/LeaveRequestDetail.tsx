"use client";

import React from "react";
import { Descriptions, Divider, Space, Typography } from "antd";
import LeaveTypeTag from "../atoms/LeaveTypeTag";
import LeaveStatusChip from "../atoms/LeaveStatusChip";
import HalfDayIndicator from "../atoms/HalfDayIndicator";
import ValidationSummaryPanel from "../molecules/ValidationSummaryPanel";
import ActionHistoryTimeline from "../molecules/ActionHistoryTimeline";
import { LeaveRequestDetailProps } from "../../types/ui.types";
import { DAY_TYPE_LABELS } from "../../utils/constants";
import styles from "../../styles/HrmLeave.module.css";

const { Title, Text } = Typography;

const LeaveRequestDetail: React.FC<LeaveRequestDetailProps> = ({
  request,
  organizationId,
  permissions,
  onApproved,
  onRejected,
  onCancelled,
}) => {
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
        <Descriptions.Item label="Employee">{request.employeeName}</Descriptions.Item>
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
          <Descriptions.Item label="Current Approver">{request.currentApproverId}</Descriptions.Item>
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
