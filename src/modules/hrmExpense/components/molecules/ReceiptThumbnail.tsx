"use client";

import React, { useRef } from "react";
import { Button, Tooltip } from "antd";
import { FileOutlined, UploadOutlined } from "@ant-design/icons";

interface Props {
  fileName?: string;
  attachmentId?: string;
  onUpload?: (file: File) => void;
}

const ReceiptThumbnail: React.FC<Props> = ({ fileName, attachmentId, onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  if (attachmentId) {
    return (
      <Tooltip title={fileName ?? "Receipt attached"}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12 }}>
          <FileOutlined style={{ color: "#1890ff" }} />
          <span style={{ color: "#1890ff" }}>{fileName ?? "Attached"}</span>
        </span>
      </Tooltip>
    );
  }

  if (onUpload) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
        <Tooltip title="Upload receipt for this line">
          <Button
            type="link"
            size="small"
            icon={<UploadOutlined />}
            style={{ padding: 0 }}
            onClick={() => inputRef.current?.click()}
          >
            Upload
          </Button>
        </Tooltip>
      </>
    );
  }

  return <span style={{ fontSize: 12, color: "#8c8c8c" }}>No receipt</span>;
};

export default ReceiptThumbnail;
