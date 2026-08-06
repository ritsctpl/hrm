'use client';

import React from 'react';
import { Button, Empty, Modal, Spin } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { TicketAttachment } from '../../types/domain.types';
import { formatBytes } from '../../utils/ticketHelpers';

interface Props {
  attachment: TicketAttachment | null;
  /** Raw base64 of the file, fetched separately — detail reads never carry it. */
  contentBase64?: string;
  loading: boolean;
  onClose: () => void;
  onDownload: () => void;
}

/**
 * Shows one attachment without leaving the ticket.
 *
 * The bytes arrive as base64 and are rendered from a `data:` URI rather than an object URL. An
 * object URL would need revoking on every close and on every swap between attachments, and a
 * missed revoke leaks the whole file for the life of the tab — for a screenshot-heavy queue that
 * adds up fast. A data URI is owned by the element and goes away with it.
 */
const AttachmentPreviewModal: React.FC<Props> = ({
  attachment,
  contentBase64,
  loading,
  onClose,
  onDownload,
}) => {
  if (!attachment) return null;

  const type = (attachment.fileType || '').toLowerCase();
  const name = (attachment.fileName || '').toLowerCase();
  const isImage = type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name);
  const isPdf = type === 'application/pdf' || name.endsWith('.pdf');
  const isText = type.startsWith('text/') || /\.(txt|log|csv)$/.test(name);
  const src = contentBase64
    ? `data:${attachment.fileType || 'application/octet-stream'};base64,${contentBase64}`
    : undefined;

  return (
    <Modal
      open
      onCancel={onClose}
      width={880}
      destroyOnHidden
      title={
        <span>
          {attachment.fileName}
          <span style={{ color: '#bfbfbf', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
            {formatBytes(attachment.fileSizeBytes)}
          </span>
        </span>
      }
      footer={[
        <Button key="download" icon={<DownloadOutlined />} onClick={onDownload}>
          Download
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <div
        style={{
          minHeight: 320,
          maxHeight: '65vh',
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fafafa',
          borderRadius: 6,
        }}
      >
        {loading || !src ? (
          loading ? (
            <Spin />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="This attachment is no longer stored"
            />
          )
        ) : isImage ? (
          <img
            src={src}
            alt={attachment.fileName}
            style={{ maxWidth: '100%', maxHeight: '62vh', objectFit: 'contain' }}
          />
        ) : isPdf ? (
          <iframe
            src={src}
            title={attachment.fileName}
            style={{ width: '100%', height: '62vh', border: 0 }}
          />
        ) : isText ? (
          <pre
            style={{
              width: '100%',
              margin: 0,
              padding: 12,
              fontSize: 12,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {(() => {
              try {
                return atob(contentBase64 as string);
              } catch {
                return 'This file could not be decoded as text.';
              }
            })()}
          </pre>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No preview for this file type — use Download."
          />
        )}
      </div>
    </Modal>
  );
};

export default AttachmentPreviewModal;
