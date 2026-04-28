"use client";

import React, { useRef, useState } from "react";
import { Button, Tooltip, message } from "antd";
import { FileOutlined, UploadOutlined, EyeOutlined } from "@ant-design/icons";
import { getOrganizationId } from "@/utils/cookieUtils";
import { HrmExpenseService } from "../../services/hrmExpenseService";
import { extractExpenseError } from "../../utils/extractExpenseError";

interface Props {
  fileName?: string;
  attachmentId?: string;
  onUpload?: (file: File) => void;
}

const ReceiptThumbnail: React.FC<Props> = ({ fileName, attachmentId, onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [opening, setOpening] = useState(false);

  const handleView = async () => {
    if (!attachmentId) return;
    setOpening(true);
    try {
      const blob = await HrmExpenseService.downloadReceipt({
        organizationId: getOrganizationId(),
        attachmentRef: attachmentId,
      });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      // Revoke after a delay so the new tab can fetch the URL.
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      message.error(extractExpenseError(error, "Failed to open receipt."));
    } finally {
      setOpening(false);
    }
  };

  if (attachmentId) {
    return (
      <Tooltip title="Click to view receipt">
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          loading={opening}
          onClick={handleView}
          style={{ padding: 0, height: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12 }}
        >
          <FileOutlined />
          <span>{fileName ?? "View"}</span>
        </Button>
      </Tooltip>
    );
  }

  if (onUpload) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
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
