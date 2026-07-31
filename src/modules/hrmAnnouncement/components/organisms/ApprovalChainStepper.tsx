"use client";

import React from "react";
import { Steps, Typography, Tag, Space, Tooltip, Alert } from "antd";
import { WarningOutlined, ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { Announcement, ApprovalChainEntry, ApprovalStepStatus } from "../../types/domain.types";

dayjs.extend(relativeTime);

const { Text } = Typography;

/** Ant Steps status per rung — SKIPPED greys out rather than reading as done. */
const STEP_STATUS: Record<ApprovalStepStatus, "finish" | "error" | "process" | "wait"> = {
  APPROVED: "finish",
  REJECTED: "error",
  RETURNED: "error",
  PENDING: "process",
  SKIPPED: "wait",
};

const STATUS_TAG: Record<ApprovalStepStatus, { color: string; label: string }> = {
  APPROVED: { color: "success", label: "Approved" },
  REJECTED: { color: "error", label: "Rejected" },
  RETURNED: { color: "gold", label: "Returned" },
  PENDING: { color: "processing", label: "Pending" },
  SKIPPED: { color: "default", label: "Skipped" },
};

interface ApprovalChainStepperProps {
  announcement: Announcement;
}

function describe(step: ApprovalChainEntry): React.ReactNode {
  const overdue =
    step.status === "PENDING" && !!step.deadline && dayjs(step.deadline).isBefore(dayjs());

  return (
    <Space direction="vertical" size={2} style={{ fontSize: 12 }}>
      {step.actedBy && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {step.actedBy}
          {step.actedAt ? ` · ${dayjs(step.actedAt).format("DD-MMM-YYYY HH:mm")}` : ""}
        </Text>
      )}

      {/* No one has acted yet — show who it is waiting on. */}
      {!step.actedBy && !!step.approverIds?.length && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Waiting on {step.approverIds.join(", ")}
        </Text>
      )}

      {step.remarks && <Text style={{ fontSize: 12 }}>&ldquo;{step.remarks}&rdquo;</Text>}

      {step.status === "SKIPPED" && step.skipReason && (
        <Text type="secondary" style={{ fontSize: 12, fontStyle: "italic" }}>
          Skipped — {step.skipReason}
        </Text>
      )}

      <Space size={4} wrap>
        {step.deadline && step.status === "PENDING" && (
          <Tooltip title={`Due ${dayjs(step.deadline).format("DD-MMM-YYYY HH:mm")}`}>
            <Tag color={overdue ? "red" : "default"} icon={<ClockCircleOutlined />}>
              {overdue ? "overdue" : `due ${dayjs(step.deadline).fromNow()}`}
            </Tag>
          </Tooltip>
        )}
        {step.escalated && (
          <Tag color="orange" icon={<WarningOutlined />}>escalated</Tag>
        )}
        {!!step.reminderCount && step.reminderCount > 0 && (
          <Tag>{step.reminderCount} reminder{step.reminderCount === 1 ? "" : "s"}</Tag>
        )}
      </Space>
    </Space>
  );
}

/**
 * The approval chain as a vertical stepper (handover §6.3) — the main visual
 * for how a notice reached its current state. Renders whatever the server
 * returned; the route is per-site configurable and never assumed here.
 */
const ApprovalChainStepper: React.FC<ApprovalChainStepperProps> = ({ announcement }) => {
  const chain = announcement.approvalChain;
  if (!chain?.length) return null;

  // Steps' `current` is an index, not a level number.
  const currentIndex =
    announcement.currentLevel == null
      ? chain.length
      : Math.max(chain.findIndex((s) => s.level === announcement.currentLevel), 0);

  return (
    <div style={{ marginTop: 8 }}>
      <Text strong>Approval chain</Text>

      {announcement.returnReason && (
        <Alert
          type="warning"
          showIcon
          style={{ margin: "8px 0" }}
          message="Returned for edit"
          description={
            <>
              {announcement.returnReason}
              {announcement.returnedBy ? ` — ${announcement.returnedBy}` : ""}
              {announcement.returnedAt
                ? ` on ${dayjs(announcement.returnedAt).format("DD-MMM-YYYY HH:mm")}`
                : ""}
            </>
          }
        />
      )}

      <Steps
        direction="vertical"
        size="small"
        current={currentIndex}
        style={{ marginTop: 8 }}
        items={chain.map((step) => ({
          title: (
            <Space size={6}>
              <span>{`L${step.level} — ${step.levelCode}`}</span>
              <Tag color={STATUS_TAG[step.status]?.color}>
                {STATUS_TAG[step.status]?.label ?? step.status}
              </Tag>
            </Space>
          ),
          description: describe(step),
          status: STEP_STATUS[step.status] ?? "wait",
        }))}
      />
    </div>
  );
};

export default ApprovalChainStepper;
