'use client';

import { useState } from 'react';
import { Empty, Typography, Button, Upload, message } from 'antd';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import { parseCookies } from 'nookies';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { formatDate, formatFileSize } from '../../utils/assetHelpers';
import type { Asset } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/AssetDetail.module.css';

interface AssetAttachmentsTabProps {
  asset: Asset;
  canUpload: boolean;
}

export default function AssetAttachmentsTab({ asset, canUpload }: AssetAttachmentsTabProps) {
  const { updateAssetInList } = useHrmAssetStore();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    const { site, userId } = parseCookies();
    if (!site) {
      message.error('Site not found in session');
      return false;
    }
    setUploading(true);
    try {
      const att = await HrmAssetService.uploadAttachment(site, asset.assetId, file, userId ?? '');
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
    <Can I="add">
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
          <Button
            type="text"
            size="small"
            icon={<DownloadIcon style={{ fontSize: 16 }} />}
            href={att.filePath}
            download={att.fileName}
          />
        </div>
      ))}
    </div>
  );
}
