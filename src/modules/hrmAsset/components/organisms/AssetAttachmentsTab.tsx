'use client';

import { Empty, Typography, Button, message } from 'antd';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import { formatDate, formatFileSize } from '../../utils/assetHelpers';
import type { Asset } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/AssetDetail.module.css';

interface AssetAttachmentsTabProps {
  asset: Asset;
  canUpload: boolean;
}

export default function AssetAttachmentsTab({ asset, canUpload }: AssetAttachmentsTabProps) {
  if (!asset.attachments?.length) {
    return (
      <div className={styles.tabContent}>
        <Empty description="No attachments" style={{ marginTop: 32 }} />
        {canUpload && <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Can I="add">
            <Button icon={<AttachFileIcon style={{ fontSize: 16 }} />} onClick={() => message.info('File upload will be available soon')}>Upload File</Button>
          </Can>
        </div>}
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      {canUpload && (
        <div style={{ marginBottom: 12 }}>
          <Can I="add">
            <Button icon={<AttachFileIcon style={{ fontSize: 16 }} />} size="small">Upload File</Button>
          </Can>
        </div>
      )}
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
