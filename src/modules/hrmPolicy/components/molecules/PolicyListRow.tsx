"use client";

import React from "react";
import { Typography, Button } from "antd";
import { EditOutlined, CalendarOutlined } from "@ant-design/icons";
import { PolicyListRowProps } from "../../types/ui.types";
import PolicyTypeBadge from "../atoms/PolicyTypeBadge";
import PolicyStatusTag from "../atoms/PolicyStatusTag";
import styles from "../../styles/PolicyLanding.module.css";

const { Text } = Typography;

const PolicyListRow: React.FC<PolicyListRowProps> = ({
  policy,
  onClick,
  onEdit,
}) => {
  const formattedDate = policy.effectiveFrom
    ? new Date(policy.effectiveFrom).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div
      className={styles.policyListRow}
      onClick={() => onClick(policy)}
      style={{ display: 'flex', alignItems: 'center', gap: 16 }}
    >
      <div style={{ width: 120, flexShrink: 0 }}>
        <Text style={{ fontSize: 12, color: '#8c8c8c', fontFamily: 'monospace' }}>{policy.policyCode}</Text>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#1f1f1f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {policy.title}
        </div>
        {policy.description && (
          <div style={{ fontSize: 11, color: '#8c8c8c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
            {policy.description}
          </div>
        )}
      </div>

      <PolicyTypeBadge docType={policy.documentType} />

      <div style={{ width: 60, textAlign: 'center', flexShrink: 0 }}>
        <Text style={{ fontSize: 12, color: '#8c8c8c' }}>v{policy.currentVersion}</Text>
      </div>

      {formattedDate && (
        <div style={{ width: 100, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <CalendarOutlined style={{ fontSize: 11, color: '#bfbfbf' }} />
          <Text style={{ fontSize: 11, color: '#8c8c8c' }}>{formattedDate}</Text>
        </div>
      )}

      <PolicyStatusTag status={policy.status} />

      {onEdit && (
        <Button
          size="small"
          type="text"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(policy);
          }}
          style={{ opacity: 0.5 }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}
        />
      )}
    </div>
  );
};

export default PolicyListRow;
