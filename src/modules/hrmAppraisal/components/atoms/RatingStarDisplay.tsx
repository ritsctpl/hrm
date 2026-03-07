'use client';

import React from "react";
import { Rate, Typography } from "antd";
import { RATING_LABELS } from "../../utils/appraisalConstants";

interface Props {
  value: number;
  max?: number;
  showLabel?: boolean;
}

const RatingStarDisplay: React.FC<Props> = ({ value, max = 5, showLabel = true }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
    <Rate disabled value={value} count={max} style={{ fontSize: 14 }} />
    {showLabel && (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {value} / {max} {RATING_LABELS[value] ? `— ${RATING_LABELS[value]}` : ""}
      </Typography.Text>
    )}
  </span>
);

export default RatingStarDisplay;
