'use client';

import { useState } from 'react';
import { Empty, Typography, Button, Upload, message, Space, Tooltip } from 'antd';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { formatDate, formatFileSize } from '../../utils/assetHelpers';
import type { Asset, AssetAttachment } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/AssetDetail.module.css';

interface AssetAttachmentsTabProps {
  asset: Asset;
  canUpload: boolean;
}

export default function AssetAttachmentsTab({ asset, canUpload }: AssetAttachmentsTabProps) {
  const { updateAssetInList } = useHrmAssetStore();
  const [uploading, setUploading] = useState(false);
  const [busyAttachmentId, setBusyAttachmentId] = useState<string | null>(null);

  /**
   * Convert a base64 data URI (data:mime;base64,xxx) to a Blob object
   */
  const dataURItoBlob = (dataURI: string): Blob => {
    const [meta, base64Data] = dataURI.split(',');
    const mimeMatch = meta.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const byteString = atob(base64Data);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uintArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uintArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([arrayBuffer], { type: mime });
  };

  /**
   * Handle attachment preview by converting filePath (data URI) to Blob URL
   */
  const handlePreview = (att: AssetAttachment) => {
    if (!att.filePath) {
      message.warning('No file path available');
      return;
    }
    setBusyAttachmentId(att.attachmentId);
    try {
      // If filePath is a data URI (starts with data:), convert to Blob
      if (att.filePath.startsWith('data:')) {
        const blob = dataURItoBlob(att.filePath);
        const blobURL = URL.createObjectURL(blob);
        window.open(blobURL, '_blank', 'noopener,noreferrer');
        // Clean up the object URL after a delay to allow the browser to load it
        setTimeout(() => URL.revokeObjectURL(blobURL), 100);
      } else {
        // If it's a regular URL, open directly
        window.open(att.filePath, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Preview error:', error);
      message.error('Failed to preview attachment');
    } finally {
      setBusyAttachmentId(null);
    }
  };

  /**
   * Handle attachment download by converting filePath to Blob and triggering download
   */
  const handleDownload = (att: AssetAttachment) => {
    if (!att.filePath) {
      message.warning('No file path available');
      return;
    }
    setBusyAttachmentId(att.attachmentId);
    try {
      // If filePath is a data URI, convert to Blob and download
      if (att.filePath.startsWith('data:')) {
        const blob = dataURItoBlob(att.filePath);
        const blobURL = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobURL;
        link.download = att.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobURL);
      } else {
        // If it's a regular URL, trigger download
        const link = document.createElement('a');
        link.href = att.filePath;
        link.download = att.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download attachment');
    } finally {
      setBusyAttachmentId(null);
    }
  };

  const handleUpload = async (file: File) => {
    const organizationId = getOrganizationId();
    const { userId, rl_user_id, userEmail } = parseCookies();
    const uploadedBy = userId || rl_user_id || userEmail || '';
    if (!organizationId) {
      message.error('Organization not found in session');
      return false;
    }
    setUploading(true);
    try {
      const att = await HrmAssetService.uploadAttachment(organizationId, asset.assetId, file, uploadedBy);
      updateAssetInList(asset.assetId, {
        attachments: [...(asset.attachments ?? []), att],
      });
      message.success('File uploaded');
    } catch {
      message.error('Upload failed');
    } finally {
      setUploading(false);
    }
    // Prevent antd's default upload behavior — we handle the request ourselves
    return false;
  };

  const uploadButton = (
    <Can I="add" object="asset_record">
      <Upload
        accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"
        showUploadList={false}
        beforeUpload={handleUpload}
        disabled={uploading}
      >
        <Button
          icon={<AttachFileIcon style={{ fontSize: 16 }} />}
          size="small"
          loading={uploading}
        >
          Upload File
        </Button>
      </Upload>
    </Can>
  );

  if (!asset.attachments?.length) {
    return (
      <div className={styles.tabContent}>
        <Empty description="No attachments" style={{ marginTop: 32 }} />
        {canUpload && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>{uploadButton}</div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      {canUpload && <div style={{ marginBottom: 12 }}>{uploadButton}</div>}
      {(asset.attachments ?? []).map((att) => (
        <div key={att.attachmentId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
          <AttachFileIcon style={{ fontSize: 16, color: '#1890ff' }} />
          <div style={{ flex: 1 }}>
            <Typography.Text>{att.fileName}</Typography.Text>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {att.fileType} · {formatFileSize(att.fileSizeBytes)} · {formatDate(att.uploadedAt)}
              </Typography.Text>
            </div>
          </div>
          <Space size={0}>
            <Tooltip title="View">
              <Button
                type="text"
                size="small"
                icon={<VisibilityIcon style={{ fontSize: 16 }} />}
                disabled={!att.filePath}
                loading={busyAttachmentId === att.attachmentId}
                onClick={() => handlePreview(att)}
              />
            </Tooltip>
            <Tooltip title="Download">
              <Button
                type="text"
                size="small"
                icon={<DownloadIcon style={{ fontSize: 16 }} />}
                disabled={!att.filePath}
                loading={busyAttachmentId === att.attachmentId}
                onClick={() => handleDownload(att)}
              />
            </Tooltip>
          </Space>
        </div>
      ))}
    </div>
  );
}
