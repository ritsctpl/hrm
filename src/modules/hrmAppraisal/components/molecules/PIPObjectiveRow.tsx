'use client';

import React from "react";
import { Tag, Typography } from "antd";
import type { PipObjective } from "../../types/domain.types";

interface Props {
  objective: PipObjective;
  index: number;
}

const PIPObjectiveRow: React.FC<Props> = ({ objective, index }) => (
  <div
    style={{
      display: "flex",
      gap: 12,
      padding: "8px 0",
      borderBottom: "1px solid #f0f0f0",
      alignItems: "flex-start",
    }}
  >
    <Typography.Text type="secondary" style={{ minWidth: 24 }}>
      {index + 1}.
    </Typography.Text>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 500 }}>{objective.description}</div>
      <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
        Due: {objective.targetDate}
        {objective.managerRemarks && ` · ${objective.managerRemarks}`}
      </div>
    </div>
    <Tag
      color={
        objective.status === "COMPLETED"
          ? "green"
          : objective.status === "OVERDUE"
          ? "red"
          : "processing"
      }
    >
      {objective.status}
    </Tag>
  </div>
);

export default PIPObjectiveRow;
