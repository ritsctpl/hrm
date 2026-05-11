"use client";

import React, { useState } from "react";
import { Upload, Button, List, Typography, message } from "antd";
import { UploadOutlined, FileOutlined, DeleteOutlined, EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import type { TravelAttachment } from "../../types/domain.types";
import Can from "../../../hrmAccess/components/Can";

const { Text } = Typography;

interface Props {
  attachments: TravelAttachment[];
  readonly?: boolean;
  onUpload?: (file: File) => Promise<void>;
  onDelete?: (attachmentId: string) => void;
  onPreview?: (attachment: TravelAttachment) => Promise<Blob>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const AttachmentsPanel: React.FC<Props> = ({ attachments, readonly, onUpload, onDelete, onPreview }) => {
  const [busyAttachmentId, setBusyAttachmentId] = useState<string | null>(null);

  const fetchBlob = async (att: TravelAttachment): Promise<Blob | null> => {
    if (!onPreview) {
      message.error("Preview is not available — no download handler wired up.");
      return null;
    }
    setBusyAttachmentId(att.attachmentId);
    try {
      return await onPreview(att);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) message.error("You do not have permission to access this file.");
      else if (status === 404) message.error("Attachment not found on the server.");
      else message.error("Failed to fetch attachment.");
      return null;
    } finally {
      setBusyAttachmentId(null);
    }
  };

  const handleView = async (att: TravelAttachment) => {
    const blob = await fetchBlob(att);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    // Revoke after a delay so the new tab has time to render the resource.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleDownload = async (att: TravelAttachment) => {
    const blob = await fetchBlob(att);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = att.fileName || "attachment";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {!readonly && onUpload && (
        <Can I="add" object="travel_attachment">
          <Upload.Dragger
            style={{ marginBottom: 16 }}
            accept=".pdf,.jpg,.jpeg,.png"
            multiple={false}
            showUploadList={false}
            beforeUpload={(file) => {
              const sizeMb = file.size / (1024 * 1024);
              if (sizeMb > 5) {
                message.error("File size must be under 5 MB.");
                return Upload.LIST_IGNORE;
              }
              if (attachments.length >= 5) {
                message.error("Maximum 5 files allowed.");
                return Upload.LIST_IGNORE;
              }
              onUpload(file);
              return false;
            }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 32, color: "#1890ff" }} />
            </p>
            <p>Drag and drop files here, or click to choose</p>
            <p style={{ fontSize: 12, color: "#8c8c8c" }}>
              Allowed: PDF, JPG, PNG — Max 5 MB each — Up to 5 files
            </p>
          </Upload.Dragger>
        </Can>
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
                  loading={busyAttachmentId === att.attachmentId}
                  onClick={() => handleView(att)}
                >
                  Preview
                </Button>,
                <Button
                  key="download"
                  type="link"
                  size="small"
                  icon={<DownloadOutlined />}
                  loading={busyAttachmentId === att.attachmentId}
                  onClick={() => handleDownload(att)}
                >
                  Download
                </Button>,
                !readonly && onDelete && (
                  <Can I="delete" object="travel_attachment" key="del">
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => onDelete(att.attachmentId)}
                    />
                  </Can>
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
