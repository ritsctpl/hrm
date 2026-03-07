'use client';

import { Empty, Typography, Button } from 'antd';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import { formatDate, formatFileSize } from '../../utils/assetHelpers';
import type { Asset } from '../../types/domain.types';
import styles from '../../styles/AssetDetail.module.css';

interface AssetAttachmentsTabProps {
  asset: Asset;
  canUpload: boolean;
}

export default function AssetAttachmentsTab({ asset, canUpload }: AssetAttachmentsTabProps) {
  if (asset.attachments.length === 0) {
    return (
      <div className={styles.tabContent}>
        <Empty description="No attachments" style={{ marginTop: 32 }} />
        {canUpload && <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Button icon={<AttachFileIcon style={{ fontSize: 16 }} />}>Upload File</Button>
        </div>}
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      {canUpload && (
        <div style={{ marginBottom: 12 }}>
          <Button icon={<AttachFileIcon style={{ fontSize: 16 }} />} size="small">Upload File</Button>
        </div>
      )}
      {asset.attachments.map((att) => (
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
