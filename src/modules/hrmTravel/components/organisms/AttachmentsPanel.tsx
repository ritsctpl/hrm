"use client";

import React, { useState } from "react";
import { Upload, Button, List, Typography, message } from "antd";
import { UploadOutlined, FileOutlined, DeleteOutlined, EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import type { TravelAttachment } from "../../types/domain.types";
import Can from "../../../hrmAccess/components/Can";
import { HrmTravelService } from "../../services/hrmTravelService";
import { getOrganizationId } from "@/utils/cookieUtils";

const { Text } = Typography;

interface Props {
  attachments: TravelAttachment[];
  readonly?: boolean;
  onUpload?: (files: File[]) => Promise<void>;
  onDelete?: (attachmentId: string) => void;
  onPreview?: (attachment: TravelAttachment) => Promise<Blob>;
  showPreviewDownload?: boolean;
  allowedFileTypes?: string[];
  maxFileSizeMb?: number;
  maxFileCount?: number;
  travelType?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const AttachmentsPanel: React.FC<Props> = ({ 
  attachments, 
  readonly, 
  onUpload, 
  onDelete, 
  onPreview, 
  showPreviewDownload = true,
  allowedFileTypes = ["pdf", "jpg", "jpeg", "png"],
  maxFileSizeMb = 5,
  maxFileCount = 5,
  travelType,
}) => {
  const organizationId = getOrganizationId();
  const [busyAttachmentId, setBusyAttachmentId] = useState<string | null>(null);
  const [batchUploading, setBatchUploading] = useState(false);

  const isPendingAttachment = (attachmentId: string): boolean => {
    return attachmentId.startsWith("pending-");
  };

  const getFileExtension = (fileName: string): string => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  /**
   * Validate a whole selection against the server-side travel policy in one
   * pass: type and size are per-file, but the count limit has to account for
   * files already accepted earlier in the same batch.
   */
  const validateBatchWithPolicy = async (
    files: File[],
  ): Promise<{ accepted: File[]; errors: string[] }> => {
    let policies;
    try {
      // Fetch latest policies from server
      policies = await HrmTravelService.getPolicies({ organizationId });
    } catch (err) {
      message.error("Failed to validate upload. Please try again.");
      return { accepted: [], errors: [] };
    }

    if (policies.length === 0) {
      return { accepted: [], errors: ["No travel policy configured — upload is not allowed."] };
    }

    // Find policy matching the current travel type
    const policy = travelType
      ? policies.find((p) => p.travelType === travelType) || policies[0]
      : policies[0];

    const accepted: File[] = [];
    const errors: string[] = [];
    let slotsLeft = policy.maxFileCount - attachments.length;

    for (const file of files) {
      const fileExt = getFileExtension(file.name);
      const sizeMb = file.size / (1024 * 1024);

      if (!policy.allowedFileTypes.includes(fileExt)) {
        errors.push(
          `${file.name}: file type .${fileExt} is not allowed. Allowed types: ${policy.allowedFileTypes.join(", ")}`,
        );
        continue;
      }
      if (sizeMb > policy.maxFileSizeMb) {
        errors.push(`${file.name}: file size must be under ${policy.maxFileSizeMb} MB.`);
        continue;
      }
      if (slotsLeft <= 0) {
        errors.push(`${file.name}: maximum ${policy.maxFileCount} files allowed.`);
        continue;
      }

      accepted.push(file);
      slotsLeft -= 1;
    }

    return { accepted, errors };
  };

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
    let base64Data = att.base64;
    let fileType = att.fileType || "application/octet-stream";
    
    // If no local base64, fetch from server via onPreview callback
    if (!base64Data) {
      if (!onPreview) {
        message.error("Preview is not available.");
        return;
      }
      
      setBusyAttachmentId(att.attachmentId);
      try {
        const blob = await onPreview(att);
        if (!blob) return;
        
        fileType = blob.type || "application/octet-stream";
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          base64Data = dataUrl.split(',')[1];
          openPreviewInNewTab(base64Data, fileType, att.fileName);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403) message.error("You do not have permission to access this file.");
        else if (status === 404) message.error("Attachment not found on the server.");
        else message.error("Failed to preview attachment.");
      } finally {
        setBusyAttachmentId(null);
      }
    } else {
      // Use local base64 data
      openPreviewInNewTab(base64Data, fileType, att.fileName);
    }
  };

  const openPreviewInNewTab = (base64Data: string, fileType: string, fileName: string) => {
    const dataUrl = `data:${fileType};base64,${base64Data}`;
    
    // Create an HTML page with iframe to display the content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${fileName}</title>
        <style>
          body { margin: 0; padding: 0; }
          iframe { width: 100%; height: 100vh; border: none; }
        </style>
      </head>
      <body>
        <iframe src="${dataUrl}" type="${fileType}"></iframe>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async (att: TravelAttachment) => {
    // First, try to use base64 data if available locally
    if (att.base64) {
      const fileType = att.fileType || "application/octet-stream";
      downloadFromBase64(att.base64, att.fileName, fileType);
      return;
    }
    
    // If no local base64, fetch from server via onPreview callback
    if (!onPreview) {
      message.error("Download is not available.");
      return;
    }
    
    setBusyAttachmentId(att.attachmentId);
    try {
      const blob = await onPreview(att);
      if (!blob) return;
      
      // Convert blob to base64 and download
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64Data = dataUrl.split(',')[1];
        downloadFromBase64(base64Data, att.fileName, blob.type);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) message.error("You do not have permission to access this file.");
      else if (status === 404) message.error("Attachment not found on the server.");
      else message.error("Failed to download attachment.");
    } finally {
      setBusyAttachmentId(null);
    }
  };

  const downloadFromBase64 = (base64Data: string, fileName: string, fileType: string) => {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "attachment";
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
            multiple
            showUploadList={false}
            disabled={batchUploading}
            beforeUpload={async (file, fileList) => {
              // antd calls this once per file but passes the whole selection —
              // handle the batch on the first call and ignore the rest so the
              // policy (especially maxFileCount) is applied to the set at once.
              if (file !== fileList[0]) return false;

              setBatchUploading(true);
              try {
                const { accepted, errors } = await validateBatchWithPolicy(
                  fileList as unknown as File[],
                );
                errors.forEach((e) => message.error(e));

                if (accepted.length > 0 && onUpload) {
                  try {
                    await onUpload(accepted);
                  } catch (err) {
                    // Error already handled by onUpload
                  }
                }
              } finally {
                setBatchUploading(false);
              }
              return false;
            }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 32, color: "#1890ff" }} />
            </p>
            <p>Drag and drop files here, or click to choose (multiple files supported)</p>
            <p style={{ fontSize: 12, color: "#8c8c8c" }}>
              Allowed: {allowedFileTypes.map(ft => ft.toUpperCase()).join(', ')} — Max {maxFileSizeMb} MB each — Up to {maxFileCount} files
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
                showPreviewDownload && (
                  <Button
                    key="view"
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    loading={busyAttachmentId === att.attachmentId}
                    onClick={() => handleView(att)}
                  >
                    Preview
                  </Button>
                ),
                showPreviewDownload && (
                  <Button
                    key="download"
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    loading={busyAttachmentId === att.attachmentId}
                    onClick={() => handleDownload(att)}
                  >
                    Download
                  </Button>
                ),
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
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Text style={{ fontSize: 13 }}>{att.fileName}</Text>
                    {isPendingAttachment(att.attachmentId) && (
                      <span style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        background: "#fff7e6",
                        color: "#ad6800",
                        borderRadius: "3px",
                        border: "1px solid #ffd591"
                      }}>
                        Pending
                      </span>
                    )}
                  </div>
                }
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
