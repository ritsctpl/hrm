'use client';

import { useState } from 'react';
import { Button, Space, Modal, message } from 'antd';
import QrCodeIcon from '@mui/icons-material/QrCode';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { HrmAssetService } from '../../services/hrmAssetService';
import { getOrganizationId } from '@/utils/cookieUtils';

interface QrDownloadButtonProps {
  assetId: string;
  /**
   * The QR code value from the asset. Preferred form is a base64-encoded PNG
   * (raw base64 or a full data: URI) so it renders + downloads with no extra
   * API call. A legacy relative/absolute URL is still handled gracefully.
   */
  qrUrl?: string;
}

/** Normalise the QR value to something an <img> / download can consume. */
function toDataUri(val?: string): string {
  if (!val) return '';
  if (val.startsWith('data:')) return val;
  // Legacy URL form (http(s) or server path) — use as-is.
  if (/^https?:\/\//i.test(val) || val.startsWith('/')) return val;
  // Otherwise assume raw base64 PNG.
  return `data:image/png;base64,${val}`;
}

/** Convert a data: URI to a Blob (for a true file download, no network call). */
function dataUriToBlob(dataUri: string): Blob {
  const [meta, b64] = dataUri.split(',');
  const mimeMatch = meta.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export default function QrDownloadButton({ assetId, qrUrl }: QrDownloadButtonProps) {
  // The QR is generated + persisted by the backend and returned with the asset
  // (preferably as base64). "View QR" opens a preview; "Download QR" saves a
  // PNG straight from the base64 with no additional API call.
  const [viewOpen, setViewOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const src = toDataUri(qrUrl);
  const hasQr = !!src;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await HrmAssetService.generateQRCode(getOrganizationId(), assetId);
      message.success('QR code generated — reopen the asset to view it');
    } catch {
      message.error('Failed to generate QR code');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!src) return;
    try {
      let href = src;
      let revoke: string | null = null;
      if (src.startsWith('data:')) {
        // Base64 → Blob → object URL. No network round-trip.
        href = URL.createObjectURL(dataUriToBlob(src));
        revoke = href;
      }
      const link = document.createElement('a');
      link.href = href;
      link.download = `${assetId}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (revoke) URL.revokeObjectURL(revoke);
    } catch {
      message.error('Failed to download QR code');
    }
  };

  return (
    <Space direction="vertical" size={6} align="center">
      {hasQr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Asset QR Code" style={{ width: 80, height: 80, border: '1px solid #f0f0f0' }} />
      ) : (
        <div style={{ width: 80, height: 80, background: '#fafafa', border: '1px dashed #d9d9d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <QrCodeIcon style={{ fontSize: 32, color: '#bfbfbf' }} />
        </div>
      )}

      {hasQr ? (
        <Space size={4}>
          <Button size="small" icon={<VisibilityIcon style={{ fontSize: 14 }} />} onClick={() => setViewOpen(true)}>
            View QR
          </Button>
          <Button size="small" icon={<DownloadIcon style={{ fontSize: 14 }} />} onClick={handleDownload}>
            Download QR
          </Button>
        </Space>
      ) : (
        <Button size="small" loading={generating} onClick={handleGenerate} icon={<QrCodeIcon style={{ fontSize: 14 }} />}>
          Generate QR
        </Button>
      )}

      <Modal
        open={viewOpen}
        title={`QR Code · ${assetId}`}
        onCancel={() => setViewOpen(false)}
        footer={[
          <Button key="dl" type="primary" icon={<DownloadIcon style={{ fontSize: 16 }} />} onClick={handleDownload}>
            Download PNG
          </Button>,
        ]}
        destroyOnHidden
      >
        {hasQr && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="Asset QR Code" style={{ width: 240, height: 240, maxWidth: '100%' }} />
          </div>
        )}
      </Modal>
    </Space>
  );
}
