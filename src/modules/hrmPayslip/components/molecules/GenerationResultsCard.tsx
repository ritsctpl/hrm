'use client';

import React from "react";
import { Alert, Statistic } from "antd";
import type { GenerationResultsCardProps } from "../../types/ui.types";

const GenerationResultsCard: React.FC<GenerationResultsCardProps> = ({
  totalRequested,
  successCount,
  failureCount,
  failedEmployeeIds,
}) => (
  <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
      <Statistic title="Requested" value={totalRequested} />
      <Statistic title="Success" value={successCount} valueStyle={{ color: "#3f8600" }} />
      <Statistic title="Failed" value={failureCount} valueStyle={{ color: "#cf1322" }} />
    </div>
    {failedEmployeeIds.length > 0 && (
      <Alert
        type="error"
        message={`Failed employees: ${failedEmployeeIds.join(", ")}`}
        showIcon
      />
    )}
  </div>
);

export default GenerationResultsCard;
