'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Empty, Spin, Typography } from 'antd';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { UserGuide } from '../../types/domain.types';
import { base64ToBlob, downloadBlob, formatDate, formatFileSize } from '../../utils/guideHelpers';
import { moduleLabel } from '../../utils/guideConstants';
import styles from '../../styles/UserGuide.module.css';

interface GuidePdfViewerProps {
  guide: UserGuide | null;
  loading: boolean;
}

/**
 * Renders the guide inline. The bytes come back as base64, which we turn into
 * a blob URL rather than feeding a `data:` URI straight to the iframe — large
 * data URLs get rejected by the browser and the frame silently stays blank.
 */
const GuidePdfViewer: React.FC<GuidePdfViewerProps> = ({ guide, loading }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const content = guide?.contentBase64;
  const mime = guide?.fileType?.includes('/') ? guide.fileType : 'application/pdf';

  useEffect(() => {
    if (!content) {
      setBlobUrl(null);
      return;
    }
    let url: string | null = null;
    try {
      url = URL.createObjectURL(base64ToBlob(content, mime));
      setBlobUrl(url);
    } catch {
      setBlobUrl(null);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [content, mime]);

  const meta = useMemo(() => {
    if (!guide) return '';
    return [
      guide.moduleName || moduleLabel(guide.moduleCode),
      guide.version ? `v${guide.version}` : null,
      formatFileSize(guide.fileSizeBytes),
      `Updated ${formatDate(guide.modifiedAt || guide.uploadedAt)}`,
      guide.uploadedBy ? `by ${guide.uploadedBy}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
  }, [guide]);

  const handleDownload = () => {
    if (!guide?.contentBase64) return;
    downloadBlob(
      base64ToBlob(guide.contentBase64, mime),
      guide.fileName || `${guide.title}.pdf`,
    );
  };

  if (!guide) return null;

  return (
    <div className={styles.viewerRoot}>
      <div className={styles.viewerHeader}>
        <div style={{ minWidth: 0 }}>
          <Typography.Text strong ellipsis style={{ fontSize: 15 }}>
            {guide.title}
          </Typography.Text>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {meta}
            </Typography.Text>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Button
            size="small"
            icon={<OpenInNewIcon style={{ fontSize: 16 }} />}
            disabled={!blobUrl}
            onClick={() => blobUrl && window.open(blobUrl, '_blank', 'noopener,noreferrer')}
          >
            Open in tab
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<DownloadIcon style={{ fontSize: 16 }} />}
            disabled={!guide.contentBase64}
            onClick={handleDownload}
          >
            Download
          </Button>
        </div>
      </div>

      <div className={styles.viewerBody}>
        {loading ? (
          <div className={styles.centered}>
            <Spin />
          </div>
        ) : blobUrl ? (
          <iframe title={guide.title} src={blobUrl} className={styles.viewerFrame} />
        ) : (
          <div className={styles.centered}>
            <Empty description="Preview unavailable — download the file to view it">
              <Button
                type="primary"
                disabled={!guide.contentBase64}
                icon={<DownloadIcon style={{ fontSize: 16 }} />}
                onClick={handleDownload}
              >
                Download
              </Button>
            </Empty>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuidePdfViewer;
