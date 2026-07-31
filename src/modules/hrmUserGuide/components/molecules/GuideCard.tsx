'use client';

import React from 'react';
import { Button, Tooltip, Typography } from 'antd';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DownloadIcon from '@mui/icons-material/Download';
import AudienceBadge from '../atoms/AudienceBadge';
import GuideStatusTag from '../atoms/GuideStatusTag';
import type { UserGuide } from '../../types/domain.types';
import { formatFileSize } from '../../utils/guideHelpers';
import styles from '../../styles/UserGuide.module.css';

interface GuideCardProps {
  guide: UserGuide;
  onOpen: (guide: UserGuide) => void;
  onDownload: (guide: UserGuide) => void;
  downloading?: boolean;
  /** Shows the status tag — the Manage tab needs it, the library doesn't. */
  showStatus?: boolean;
}

const GuideCard: React.FC<GuideCardProps> = ({
  guide,
  onOpen,
  onDownload,
  downloading,
  showStatus,
}) => (
  <div
    className={styles.guideCard}
    role="button"
    tabIndex={0}
    onClick={() => onOpen(guide)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen(guide);
      }
    }}
  >
    <div className={styles.guideCardIcon}>
      <PictureAsPdfIcon style={{ fontSize: 30, color: '#d4380d' }} />
    </div>

    <div className={styles.guideCardBody}>
      <Typography.Text className={styles.guideCardTitle} ellipsis={{ tooltip: guide.title }}>
        {guide.title}
      </Typography.Text>
      {guide.description && (
        <Typography.Paragraph
          type="secondary"
          className={styles.guideCardDesc}
          ellipsis={{ rows: 2, tooltip: guide.description }}
        >
          {guide.description}
        </Typography.Paragraph>
      )}
      <div className={styles.guideCardMeta}>
        {guide.version && <span>v{guide.version}</span>}
        <span>{formatFileSize(guide.fileSizeBytes)}</span>
        <AudienceBadge audience={guide.audience} />
        {showStatus && <GuideStatusTag status={guide.status} />}
      </div>
    </div>

    <div className={styles.guideCardActions} onClick={(e) => e.stopPropagation()}>
      <Button size="small" type="link" onClick={() => onOpen(guide)}>
        View
      </Button>
      <Tooltip title="Download">
        <Button
          size="small"
          type="text"
          loading={downloading}
          icon={<DownloadIcon style={{ fontSize: 16 }} />}
          onClick={() => onDownload(guide)}
        />
      </Tooltip>
    </div>
  </div>
);

export default GuideCard;
