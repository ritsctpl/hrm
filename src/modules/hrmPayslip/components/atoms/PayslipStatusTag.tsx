'use client';

import React from "react";
import { Tag } from "antd";
import type { PayslipStatus } from "../../types/domain.types";

const STATUS_CONFIG: Record<PayslipStatus, { color: string; label: string }> = {
  GENERATED: { color: "green", label: "Generated" },
  FAILED: { color: "red", label: "Failed" },
  REGENERATED: { color: "blue", label: "Regenerated" },
};

interface Props {
  status: PayslipStatus;
}

const PayslipStatusTag: React.FC<Props> = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? { color: "default", label: status };
  return <Tag color={config.color}>{config.label}</Tag>;
};

export default PayslipStatusTag;
