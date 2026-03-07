"use client";

import { Button } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import type { EmpSaveButtonProps } from "../../types/ui.types";

export default function EmpSaveButton({ loading, onClick, label = "Save" }: EmpSaveButtonProps) {
  return (
    <Button
      type="primary"
      icon={<SaveOutlined />}
      loading={loading}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
