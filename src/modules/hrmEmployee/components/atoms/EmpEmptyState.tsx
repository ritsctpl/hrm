"use client";

import { Empty } from "antd";
import type { EmpEmptyStateProps } from "../../types/ui.types";

export default function EmpEmptyState({ icon, title, description }: EmpEmptyStateProps) {
  return (
    <Empty
      image={icon}
      imageStyle={{ height: 48 }}
      description={
        <span>
          <strong>{title}</strong>
          <br />
          <span style={{ color: "#8c8c8c", fontSize: 13 }}>{description}</span>
        </span>
      }
    />
  );
}
