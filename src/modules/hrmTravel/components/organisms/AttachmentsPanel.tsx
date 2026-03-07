"use client";

import React from "react";
import { Upload, Button, List, Typography, message } from "antd";
import { UploadOutlined, FileOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import type { TravelAttachment } from "../../types/domain.types";

const { Text } = Typography;

interface Props {
  attachments: TravelAttachment[];
  readonly?: boolean;
  onUpload?: (file: File) => Promise<void>;
  onDelete?: (attachmentId: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const AttachmentsPanel: React.FC<Props> = ({ attachments, readonly, onUpload, onDelete }) => {
  return (
    <div>
      {!readonly && onUpload && (
        <Upload
          accept=".pdf,.jpg,.jpeg,.png"
          showUploadList={false}
          beforeUpload={(file) => {
            const sizeMb = file.size / (1024 * 1024);
            if (sizeMb > 5) {
              message.error("File size must be under 5 MB.");
              return false;
            }
            if (attachments.length >= 5) {
              message.error("Maximum 5 files allowed.");
              return false;
            }
            onUpload(file);
            return false;
          }}
        >
          <Upload.Dragger
            style={{ marginBottom: 16 }}
            accept=".pdf,.jpg,.jpeg,.png"
            showUploadList={false}
            beforeUpload={() => false}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 32, color: "#1890ff" }} />
            </p>
            <p>Drag and drop files here, or click to choose</p>
            <p style={{ fontSize: 12, color: "#8c8c8c" }}>
              Allowed: PDF, JPG, PNG — Max 5 MB each — Up to 5 files
            </p>
          </Upload.Dragger>
        </Upload>
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
                <Button
                  key="view"
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                >
                  View
                </Button>,
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
    </div>
  );
};

export default AttachmentsPanel;
