"use client";

import React from "react";
import { Tag, Tooltip } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { SlaInfo } from "../../types/ui.types";

interface Props {
  sla: SlaInfo;
  /** Optional ISO deadline string for the tooltip body */
  deadline?: string;
}

const SlaIndicator: React.FC<Props> = ({ sla, deadline }) => {
  if (!sla.label) return null;
  const tip = deadline
    ? `Due by ${dayjs(deadline).format("DD MMM YYYY, hh:mm A")}`
    : sla.label;
  return (
    <Tooltip title={tip}>
      <Tag
        icon={<ClockCircleOutlined />}
        color={sla.isOverdue ? "error" : sla.color === "warning" ? "warning" : "success"}
      >
        {sla.isOverdue ? "Overdue" : sla.label}
      </Tag>
    </Tooltip>
  );
};

export default SlaIndicator;
