'use client';

import { useState } from 'react';
import { Empty, Typography, Button, Upload, message, Space, Tooltip, Popconfirm } from 'antd';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
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
   * Resolve an attachment's content to something a browser can open.
   * The backend may return `filePath` as:
   *   - a full data URI (`data:application/pdf;base64,...`) → use as-is
   *   - an http(s) URL or server path (`/...`) → open directly
   *   - **bare base64** (no `data:` prefix) → graft on a `data:<mime>;base64,`
   *     prefix from `fileType` so the document opens instead of trying to load
   *     a giant base64 string as a URL (which failed to show "properly").
   */
  // Resolve a real MIME type so the browser PREVIEWS (pdf/image) instead of
  // downloading. `fileType` may be a full MIME ("application/pdf"), a bare
  // extension ("pdf"), or empty — fall back to the filename extension.
  const EXT_MIME: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml',
    txt: 'text/plain', csv: 'text/csv',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  const resolveMime = (att: AssetAttachment): string => {
    const ft = (att.fileType || '').toLowerCase().trim();
    if (ft.includes('/')) return ft;
    if (ft && EXT_MIME[ft]) return EXT_MIME[ft];
    const ext = (att.fileName || '').split('.').pop()?.toLowerCase() ?? '';
    return EXT_MIME[ext] ?? 'application/octet-stream';
  };

  const buildHref = (att: AssetAttachment): string => {
    // Only the legacy shapes are resolvable synchronously now. Asset responses no longer
    // carry the file bytes, so the normal path is resolveContentUrl below, which asks the
    // server for this one attachment.
    if (att.contentBase64) {
      const c = att.contentBase64;
      return c.startsWith('data:') ? c : `data:${resolveMime(att)};base64,${c}`;
    }
    const fp = att.filePath;
    if (!fp) return '';
    if (fp.startsWith('data:')) {
      // A data URI whose MIME is generic (octet-stream / missing) makes the
      // browser DOWNLOAD instead of preview — rewrite it with a real MIME.
      const m = fp.match(/^data:([^;]*);base64,([\s\S]*)$/);
      if (m && (!m[1] || m[1].toLowerCase() === 'application/octet-stream')) {
        return `data:${resolveMime(att)};base64,${m[2]}`;
      }
      return fp;
    }
    if (/^https?:\/\//i.test(fp) || fp.startsWith('/')) return fp;
    return `data:${resolveMime(att)};base64,${fp}`;
  };

  /**
   * An object URL for one attachment's bytes, fetched on demand.
   *
   * Returns `{ url, revoke }` — revoke is null for a plain http(s) link, which is not ours to
   * release. Falls back to the legacy inline shapes so records that still carry their own
   * content keep working without a round trip.
   */
  const resolveContentUrl = async (
    att: AssetAttachment,
  ): Promise<{ url: string; revoke: string | null }> => {
    const legacy = buildHref(att);
    if (legacy) {
      if (legacy.startsWith('data:')) {
        const url = URL.createObjectURL(dataURItoBlob(legacy));
        return { url, revoke: url };
      }
      if (/^https?:\/\//i.test(legacy)) return { url: legacy, revoke: null };
    }
    const blob = await HrmAssetService.getAttachmentContent(att.attachmentId);
    // The server sends the stored MIME; fall back to our own guess if it sent none.
    const typed = blob.type ? blob : new Blob([blob], { type: resolveMime(att) });
    const url = URL.createObjectURL(typed);
    return { url, revoke: url };
  };

  /**
   * Open the document in a new tab, fetching its bytes first.
   */
  const handlePreview = async (att: AssetAttachment) => {
    setBusyAttachmentId(att.attachmentId);
    try {
      const { url, revoke } = await resolveContentUrl(att);
      window.open(url, '_blank', 'noopener,noreferrer');
      if (revoke) setTimeout(() => URL.revokeObjectURL(revoke), 60_000);
    } catch (error) {
      console.error('Preview error:', error);
      message.error('Failed to preview attachment');
    } finally {
      setBusyAttachmentId(null);
    }
  };

  /**
   * Download the document, materialising data URIs as a Blob first.
   */
  const handleDownload = async (att: AssetAttachment) => {
    setBusyAttachmentId(att.attachmentId);
    try {
      const { url: linkHref, revoke } = await resolveContentUrl(att);
      const link = document.createElement('a');
      link.href = linkHref;
      link.download = att.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (revoke) URL.revokeObjectURL(revoke);
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download attachment');
    } finally {
      setBusyAttachmentId(null);
    }
  };

  const handleDelete = async (att: AssetAttachment) => {
    const organizationId = getOrganizationId();
    const { userId, rl_user_id, userEmail } = parseCookies();
    const deletedBy = userId || rl_user_id || userEmail || '';
    setBusyAttachmentId(att.attachmentId);
    try {
      await HrmAssetService.deleteAttachment(organizationId, asset.assetId, att.attachmentId, deletedBy);
      updateAssetInList(asset.assetId, {
        attachments: (asset.attachments ?? []).filter((a) => a.attachmentId !== att.attachmentId),
      });
      message.success('Attachment deleted');
    } catch {
      message.error('Failed to delete attachment');
    } finally {
      setBusyAttachmentId(null);
    }
  };

  /**
   * Upload a whole selection at once. antd calls `beforeUpload` once per file
   * but hands each call the full batch, so we act only on the first call and
   * upload the batch serially — the asset prop doesn't re-render between
   * calls, so parallel uploads would each append to a stale attachment list
   * and only the last one would survive.
   */
  const handleUploadBatch = async (files: File[]) => {
    const organizationId = getOrganizationId();
    const { userId, rl_user_id, userEmail } = parseCookies();
    const uploadedBy = userId || rl_user_id || userEmail || '';
    if (!organizationId) {
      message.error('Organization not found in session');
      return;
    }
    setUploading(true);
    const uploaded: AssetAttachment[] = [];
    const failed: string[] = [];
    try {
      for (const file of files) {
        try {
          const att = await HrmAssetService.uploadAttachment(organizationId, asset.assetId, file, uploadedBy);
          uploaded.push(att);
        } catch {
          failed.push(file.name);
        }
      }
      if (uploaded.length > 0) {
        updateAssetInList(asset.assetId, {
          attachments: [...(asset.attachments ?? []), ...uploaded],
        });
        message.success(uploaded.length === 1 ? 'File uploaded' : `${uploaded.length} files uploaded`);
      }
      if (failed.length > 0) {
        message.error(`Upload failed: ${failed.join(', ')}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const uploadButton = (
    <Can I="add" object="asset_record">
      <Upload
        accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"
        multiple
        showUploadList={false}
        beforeUpload={(file, fileList) => {
          if (file === fileList[0]) handleUploadBatch(fileList as unknown as File[]);
          // Prevent antd's default upload behavior — we handle the request ourselves
          return false;
        }}
        disabled={uploading}
      >
        <Button
          icon={<AttachFileIcon style={{ fontSize: 16 }} />}
          size="small"
          loading={uploading}
        >
          Upload Files
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
                disabled={!att.attachmentId && !att.filePath && !att.contentBase64}
                loading={busyAttachmentId === att.attachmentId}
                onClick={() => handlePreview(att)}
              />
            </Tooltip>
            <Tooltip title="Download">
              <Button
                type="text"
                size="small"
                icon={<DownloadIcon style={{ fontSize: 16 }} />}
                disabled={!att.attachmentId && !att.filePath && !att.contentBase64}
                loading={busyAttachmentId === att.attachmentId}
                onClick={() => handleDownload(att)}
              />
            </Tooltip>
            <Can I="delete" object="asset_record">
              <Popconfirm
                title="Delete attachment"
                description={`Delete "${att.fileName}"? This cannot be undone.`}
                okText="Delete"
                okButtonProps={{ danger: true }}
                onConfirm={() => handleDelete(att)}
              >
                <Tooltip title="Delete">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteIcon style={{ fontSize: 16 }} />}
                    loading={busyAttachmentId === att.attachmentId}
                  />
                </Tooltip>
              </Popconfirm>
            </Can>
          </Space>
        </div>
      ))}
    </div>
  );
}
