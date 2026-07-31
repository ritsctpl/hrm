"use client";

import React from "react";
import { Steps, Alert, Typography, Spin, Tag, Space } from "antd";
import type { ApprovalRoutePreview } from "../../types/api.types";

const { Text } = Typography;

interface ApprovalRoutePanelProps {
  preview: ApprovalRoutePreview | null;
  loading: boolean;
  /** Non-null when previewRoute failed — the composer still works, blind. */
  error?: string | null;
}

/**
 * Renders the server-resolved approval chain (handover §4.4).
 *
 * Never hard-code the route: it is configurable per site, so whatever the
 * server returns is the truth. An unresolvable level is surfaced here at
 * compose time rather than as a 422 on submit — telling someone their notice
 * cannot be submitted *after* they wrote it is the worst moment to say so.
 */
const ApprovalRoutePanel: React.FC<ApprovalRoutePanelProps> = ({ preview, loading, error }) => {
  if (loading) {
    return (
      <div style={{ padding: "8px 0" }}>
        <Spin size="small" /> <Text type="secondary" style={{ fontSize: 12 }}>Resolving approval route…</Text>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Could not load the approval route"
        description={`${error} — you can still save a draft, but the required approvals are unknown.`}
        style={{ marginBottom: 16 }}
      />
    );
  }

  if (!preview) return null;

  if (!preview.approvalRequired) {
    return (
      <Alert
        type="success"
        showIcon
        message="No approval needed"
        description="This priority publishes directly, provided you hold Publish (General)."
        style={{ marginBottom: 16 }}
      />
    );
  }

  const unresolvable = preview.levels.filter((l) => !l.resolvable);
  const chainSummary = preview.levels.map((l) => l.levelCode).join(" → ");

  return (
    <div style={{ marginBottom: 16 }}>
      <Text strong style={{ fontSize: 13 }}>Approval route</Text>
      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
        This will need approval from {chainSummary}.
      </Text>

      <Steps
        direction="vertical"
        size="small"
        current={-1}
        items={preview.levels.map((l) => ({
          title: (
            <Space size={6}>
              <span>{`L${l.level} — ${l.levelCode}`}</span>
              <Tag color={l.resolvable ? "blue" : "red"}>
                {l.resolvable ? `${l.approverIds.length} approver${l.approverIds.length === 1 ? "" : "s"}` : "unresolved"}
              </Tag>
            </Space>
          ),
          description: (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {l.resolvable && l.approverIds.length > 0 ? l.approverIds.join(", ") : "No one holds this permission"}
              {` · SLA ${l.slaHours}h · ${l.resolverType}`}
            </Text>
          ),
          status: l.resolvable ? "wait" : "error",
        }))}
      />

      {unresolvable.length > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginTop: 8 }}
          message="This cannot be submitted"
          description={`No one at this site holds the permission for ${unresolvable
            .map((l) => l.levelCode)
            .join(", ")}. Ask an administrator to grant it.`}
        />
      )}
    </div>
  );
};

export default ApprovalRoutePanel;
