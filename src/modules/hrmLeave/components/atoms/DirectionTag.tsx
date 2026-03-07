"use client";

import React from "react";
import { Tag } from "antd";
import { DirectionTagProps } from "../../types/ui.types";

const DirectionTag: React.FC<DirectionTagProps> = ({ direction }) => {
  return (
    <Tag
      color={direction === "CR" ? "green" : "red"}
      style={{ fontWeight: 700, minWidth: 32, textAlign: "center" }}
    >
      {direction}
    </Tag>
  );
};

export default DirectionTag;
