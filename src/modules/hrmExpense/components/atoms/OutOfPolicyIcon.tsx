"use client";

import React from "react";
import { Tooltip } from "antd";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface Props {
  reason?: string;
}

const OutOfPolicyIcon: React.FC<Props> = ({ reason }) => {
  return (
    <Tooltip title={reason ?? "Out of Policy"}>
      <WarningAmberIcon style={{ fontSize: 16, color: "#ff4d4f", verticalAlign: "middle" }} />
    </Tooltip>
  );
};

export default OutOfPolicyIcon;
