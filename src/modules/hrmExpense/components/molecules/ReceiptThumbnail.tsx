"use client";

import React from "react";
import { Button, Tooltip } from "antd";
import { FileOutlined } from "@ant-design/icons";

interface Props {
  fileName?: string;
  attachmentId?: string;
}

const ReceiptThumbnail: React.FC<Props> = ({ fileName, attachmentId }) => {
  if (!attachmentId) {
    return (
      <span style={{ fontSize: 12, color: "#8c8c8c" }}>No receipt</span>
    );
  }
  return (
    <Tooltip title={fileName ?? "View Receipt"}>
      <Button type="link" size="small" icon={<FileOutlined />} style={{ padding: 0 }}>
        PDF
      </Button>
    </Tooltip>
  );
};

export default ReceiptThumbnail;
