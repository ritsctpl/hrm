"use client";

import React from "react";
import { PolicyDocType } from "../../types/domain.types";
import { POLICY_DOC_TYPE_LABELS } from "../../utils/constants";

interface PolicyTypeBadgeProps {
  docType: PolicyDocType;
}

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  POLICY: { bg: 'rgba(24,144,255,0.08)', color: '#1890ff' },
  SOP: { bg: 'rgba(82,196,26,0.08)', color: '#389e0d' },
  REGULATION: { bg: 'rgba(114,46,209,0.08)', color: '#722ed1' },
  GUIDELINE: { bg: 'rgba(250,140,22,0.08)', color: '#d48806' },
  CODE_OF_CONDUCT: { bg: 'rgba(245,34,45,0.06)', color: '#cf1322' },
};

const PolicyTypeBadge: React.FC<PolicyTypeBadgeProps> = ({ docType }) => {
  const style = BADGE_STYLES[docType] || BADGE_STYLES.POLICY;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: '18px',
        letterSpacing: 0.2,
        background: style.bg,
        color: style.color,
        whiteSpace: 'nowrap',
      }}
    >
      {POLICY_DOC_TYPE_LABELS[docType]}
    </span>
  );
};

export default PolicyTypeBadge;
