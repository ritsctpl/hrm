"use client";

import React from "react";
import { Tag } from "antd";
import { PolicyStatus } from "../../types/domain.types";
import { POLICY_STATUS_COLORS, POLICY_STATUS_LABELS } from "../../utils/constants";

interface PolicyStatusTagProps {
  status: PolicyStatus;
}

const PolicyStatusTag: React.FC<PolicyStatusTagProps> = ({ status }) => (
  <Tag color={POLICY_STATUS_COLORS[status]}>{POLICY_STATUS_LABELS[status]}</Tag>
);

export default PolicyStatusTag;
