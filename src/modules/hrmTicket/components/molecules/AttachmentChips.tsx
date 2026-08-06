'use client';

import React from 'react';
import { Button, Space, Tooltip } from 'antd';
import { DownloadOutlined, EyeOutlined, PaperClipOutlined } from '@ant-design/icons';
import type { TicketAttachment } from '../../types/domain.types';
import { formatBytes } from '../../utils/ticketHelpers';

interface Props {
  attachments?: TicketAttachment[];
  onPreview: (attachment: TicketAttachment) => void;
  onDownload: (attachment: TicketAttachment) => void;
  compact?: boolean;
}

/** Types the preview can actually render. Anything else goes straight to download. */
export function isPreviewable(fileType?: string, fileName?: string): boolean {
  const type = (fileType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();
  return (
    type.startsWith('image/') ||
    type === 'application/pdf' ||
    type.startsWith('text/') ||
    /\.(png|jpe?g|gif|webp|bmp|svg|pdf|txt|log|csv)$/.test(name)
  );
}

/**
 * The attachments on a ticket or a comment.
 *
 * Preview is the primary action and download the secondary one: most ticket attachments are a
 * screenshot of the thing that is broken, and making an agent download a file to a disk, find it,
 * and open it — for every ticket in a queue — is the difference between glancing at a problem and
 * doing filing. Types the browser cannot render skip straight to download rather than opening an
 * empty frame.
 */
const AttachmentChips: React.FC<Props> = ({ attachments, onPreview, onDownload, compact }) => {
  if (!attachments?.length) return null;

  return (
    <Space size={6} wrap style={{ marginTop: compact ? 8 : 0 }}>
      {attachments.map((attachment) => {
        const previewable = isPreviewable(attachment.fileType, attachment.fileName);
        return (
          <Button.Group key={attachment.attachmentId} size="small">
            <Tooltip title={previewable ? 'Preview' : 'This file type cannot be previewed'}>
              <Button
                size="small"
                icon={previewable ? <EyeOutlined /> : <PaperClipOutlined />}
                onClick={() => (previewable ? onPreview(attachment) : onDownload(attachment))}
              >
                <span style={{ maxWidth: 180, display: 'inline-block', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>
                  {attachment.fileName}
                </span>
                <span style={{ color: '#bfbfbf', marginLeft: 6 }}>
                  {formatBytes(attachment.fileSizeBytes)}
                </span>
              </Button>
            </Tooltip>
            <Tooltip title="Download">
              <Button size="small" icon={<DownloadOutlined />} onClick={() => onDownload(attachment)} />
            </Tooltip>
          </Button.Group>
        );
      })}
    </Space>
  );
};

export default AttachmentChips;
