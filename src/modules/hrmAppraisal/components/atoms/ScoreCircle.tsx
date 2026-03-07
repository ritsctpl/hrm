'use client';

import React from "react";
import { Progress } from "antd";
import { RATING_COLORS } from "../../utils/appraisalConstants";

interface Props {
  score: number;
  max?: number;
  size?: number;
}

const ScoreCircle: React.FC<Props> = ({ score, max = 5, size = 80 }) => {
  const percent = Math.round((score / max) * 100);
  const rating = Math.round(score);
  const color = RATING_COLORS[rating] ?? "#1890ff";

  return (
    <Progress
      type="circle"
      percent={percent}
      width={size}
      strokeColor={color}
      format={() => `${score.toFixed(1)}`}
    />
  );
};

export default ScoreCircle;
