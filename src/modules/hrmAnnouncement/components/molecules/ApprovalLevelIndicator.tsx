"use client";

import React from "react";
import { Space, Tag, Tooltip, Typography } from "antd";
import { ClockCircleOutlined, WarningOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Announcement, ApprovalChainEntry } from "../../types/domain.types";

const { Text } = Typography;

/** The rung currently awaiting action, or null when the chain is done/unstarted. */
export function currentStep(a: Announcement): ApprovalChainEntry | null {
  if (!a.approvalChain?.length || a.currentLevel == null) return null;
  return a.approvalChain.find((s) => s.level === a.currentLevel) ?? null;
}

interface ApprovalLevelIndicatorProps {
  announcement: Announcement;
}

/**
 * "L1 of 2 · HR_HEAD" plus escalation/overdue badges (handover §6.2).
 * Overdue is computed client-side from the rung's deadline.
 */
const ApprovalLevelIndicator: React.FC<ApprovalLevelIndicatorProps> = ({ announcement }) => {
  const step = currentStep(announcement);
  const total = announcement.approvalChain?.length ?? 0;

  if (!step) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;

  const overdue = !!step.deadline && dayjs(step.deadline).isBefore(dayjs());

  return (
    <Space size={4} wrap>
      <Text style={{ fontSize: 12 }}>
        L{step.level} of {total}
      </Text>
      <Tag>{step.levelCode}</Tag>
      {step.escalated && (
        <Tooltip title="Escalated after the SLA was breached">
          <Tag color="orange" icon={<WarningOutlined />}>escalated</Tag>
        </Tooltip>
      )}
      {overdue && (
        <Tooltip title={`Due ${dayjs(step.deadline).format("DD-MMM-YYYY HH:mm")}`}>
          <Tag color="red" icon={<ClockCircleOutlined />}>overdue</Tag>
        </Tooltip>
      )}
    </Space>
  );
};

export default ApprovalLevelIndicator;
