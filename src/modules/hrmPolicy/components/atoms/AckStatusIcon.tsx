"use client";

import React from "react";
import { Tooltip } from "antd";
import { CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { AckStatus } from "../../types/domain.types";

interface AckStatusIconProps {
  ackStatus: AckStatus;
  acknowledgedAt?: string;
}

const AckStatusIcon: React.FC<AckStatusIconProps> = ({ ackStatus, acknowledgedAt }) => {
  if (ackStatus === "ACKNOWLEDGED") {
    return (
      <Tooltip title={`Acknowledged ${acknowledgedAt ? `on ${acknowledgedAt}` : ""}`}>
        <CheckCircleOutlined style={{ color: "#52c41a" }} />
      </Tooltip>
    );
  }
  if (ackStatus === "OVERDUE") {
    return (
      <Tooltip title="Acknowledgment overdue">
        <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
      </Tooltip>
    );
  }
  if (ackStatus === "REQUIRED") {
    return (
      <Tooltip title="Acknowledgment required">
        <ClockCircleOutlined style={{ color: "#faad14" }} />
      </Tooltip>
    );
  }
  return null;
};

export default AckStatusIcon;
