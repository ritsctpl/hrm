'use client';

import React from "react";
import { Button } from "antd";
import { RATING_LABELS } from "../../utils/appraisalConstants";
import type { RatingStarInputProps } from "../../types/ui.types";

const RatingStarInput: React.FC<RatingStarInputProps> = ({
  value,
  onChange,
  disabled = false,
  max = 5,
  labels,
}) => {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: max }, (_, i) => i + 1).map((rating) => (
        <Button
          key={rating}
          size="small"
          type={value === rating ? "primary" : "default"}
          disabled={disabled}
          onClick={() => onChange(rating)}
          title={labels ? labels[rating - 1] : RATING_LABELS[rating]}
          style={{ minWidth: 32 }}
        >
          {rating}
        </Button>
      ))}
    </div>
  );
};

export default RatingStarInput;
