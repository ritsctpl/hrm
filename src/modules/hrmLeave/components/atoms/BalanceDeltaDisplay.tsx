"use client";

import React from "react";
import { ArrowForward } from "@mui/icons-material";
import { BalanceDeltaDisplayProps } from "../../types/ui.types";

const BalanceDeltaDisplay: React.FC<BalanceDeltaDisplayProps> = ({ before, after }) => {
  const color = after >= before ? "#52c41a" : "#ff4d4f";

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13 }}>
      <span style={{ color: "#595959" }}>{before.toFixed(1)}d</span>
      <ArrowForward style={{ fontSize: 14, color }} />
      <span style={{ color, fontWeight: 600 }}>{after.toFixed(1)}d</span>
    </span>
  );
};

export default BalanceDeltaDisplay;
