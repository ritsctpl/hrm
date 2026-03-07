"use client";

import React from "react";
import { Tag } from "antd";
import { PolicyDocType } from "../../types/domain.types";
import { POLICY_DOC_TYPE_COLORS, POLICY_DOC_TYPE_LABELS } from "../../utils/constants";

interface PolicyTypeBadgeProps {
  docType: PolicyDocType;
}

const PolicyTypeBadge: React.FC<PolicyTypeBadgeProps> = ({ docType }) => (
  <Tag color={POLICY_DOC_TYPE_COLORS[docType]}>{POLICY_DOC_TYPE_LABELS[docType]}</Tag>
);

export default PolicyTypeBadge;
