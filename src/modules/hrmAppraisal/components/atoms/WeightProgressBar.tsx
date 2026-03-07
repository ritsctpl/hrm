'use client';

import React from "react";
import { Progress, Tooltip } from "antd";

interface Props {
  weight: number;
  totalWeight: number;
}

const WeightProgressBar: React.FC<Props> = ({ weight, totalWeight }) => {
  const isOver = totalWeight > 100;
  const status = isOver ? "exception" : totalWeight === 100 ? "success" : "active";

  return (
    <Tooltip title={`${weight}% of total ${totalWeight}%`}>
      <Progress
        percent={weight}
        size="small"
        status={status}
        showInfo={false}
        style={{ width: 80 }}
      />
    </Tooltip>
  );
};

export default WeightProgressBar;
