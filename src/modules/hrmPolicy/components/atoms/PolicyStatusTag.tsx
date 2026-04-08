"use client";

import React from "react";
import { PolicyStatus } from "../../types/domain.types";
import { POLICY_STATUS_LABELS } from "../../utils/constants";

interface PolicyStatusTagProps {
  status: PolicyStatus;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  DRAFT: { bg: 'rgba(0,0,0,0.04)', color: '#8c8c8c', dot: '#8c8c8c' },
  REVIEW: { bg: 'rgba(24,144,255,0.08)', color: '#1890ff', dot: '#1890ff' },
  APPROVED: { bg: 'rgba(19,194,194,0.08)', color: '#13c2c2', dot: '#13c2c2' },
  PUBLISHED: { bg: 'rgba(82,196,26,0.08)', color: '#389e0d', dot: '#52c41a' },
  RETIRED: { bg: 'rgba(250,173,20,0.08)', color: '#d48806', dot: '#faad14' },
  SUPERSEDED: { bg: 'rgba(245,34,45,0.06)', color: '#cf1322', dot: '#ff4d4f' },
};

const PolicyStatusTag: React.FC<PolicyStatusTagProps> = ({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.DRAFT;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: '18px',
        background: style.bg,
        color: style.color,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: style.dot,
        flexShrink: 0,
      }} />
      {POLICY_STATUS_LABELS[status]}
    </span>
  );
};

export default PolicyStatusTag;
