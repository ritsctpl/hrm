"use client";

import React from "react";
import { Upload, List, Button, Typography, message, Checkbox } from "antd";
import { UploadOutlined, FileOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import type { ExpenseAttachment } from "../../types/domain.types";

const { Text } = Typography;

interface Props {
  attachments: ExpenseAttachment[];
  readonly?: boolean;
  isFinance?: boolean;
  originalsReceived?: boolean;
  onOriginalsChange?: (received: boolean) => void;
  onUpload?: (file: File) => Promise<void>;
  onDelete?: (attachmentId: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ExpenseAttachmentsPanel: React.FC<Props> = ({
  attachments,
  readonly,
  isFinance,
  originalsReceived,
  onOriginalsChange,
  onUpload,
  onDelete,
}) => {
  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
        PDF bills are mandatory for all REIMBURSEMENT line items.
      </Text>

      {!readonly && onUpload && (
        <Upload.Dragger
          accept=".pdf"
          showUploadList={false}
          beforeUpload={(file) => {
            if (file.size > 5 * 1024 * 1024) {
              message.error("File size must be under 5 MB.");
              return false;
            }
            onUpload(file);
            return false;
          }}
          style={{ marginBottom: 16 }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: 32, color: "#1890ff" }} />
          </p>
          <p>Drag and drop PDF files here, or click to choose</p>
          <p style={{ fontSize: 12, color: "#8c8c8c" }}>PDF only — Max 5 MB per file</p>
        </Upload.Dragger>
      )}

      {attachments.length === 0 ? (
        <div style={{ padding: "24px", textAlign: "center", color: "#8c8c8c" }}>
          No attachments uploaded.
        </div>
      ) : (
        <List
          bordered
          size="small"
          dataSource={attachments}
          renderItem={(att) => (
            <List.Item
              actions={[
                <Button key="view" type="link" size="small" icon={<EyeOutlined />}>View</Button>,
                !readonly && onDelete && (
                  <Button
                    key="del"
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete(att.attachmentId)}
                  />
                ),
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={<FileOutlined style={{ fontSize: 18, color: "#1890ff" }} />}
                title={<Text style={{ fontSize: 13 }}>{att.fileName}</Text>}
                description={<Text type="secondary" style={{ fontSize: 12 }}>{formatBytes(att.fileSizeBytes)}</Text>}
              />
            </List.Item>
          )}
        />
      )}

      {(isFinance || readonly) && (
        <div style={{ marginTop: 16 }}>
          <Checkbox
            checked={originalsReceived}
            onChange={(e) => onOriginalsChange?.(e.target.checked)}
            disabled={!isFinance}
          >
            Originals Received (set by Finance after physical submission)
          </Checkbox>
        </div>
      )}
    </div>
  );
};

export default ExpenseAttachmentsPanel;
