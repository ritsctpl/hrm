'use client';

import { useState } from 'react';
import { Button, Space, message } from 'antd';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { HrmAssetService } from '../../services/hrmAssetService';
import { getOrganizationId } from '@/utils/cookieUtils';

interface QrDownloadButtonProps {
  assetId: string;
  qrUrl?: string;
}

export default function QrDownloadButton({ assetId, qrUrl }: QrDownloadButtonProps) {
  // The QR image is loaded ONLY when the user asks to see it. Previously the
  // <img src={qrUrl}> rendered on mount, which made the browser auto-GET
  // `/asset/<id>/qr?site=...` every time the Overview tab opened — an unwanted
  // network call. Now nothing fetches until "View QR" is clicked.
  const [showQr, setShowQr] = useState(false);

  const handleGenerate = async () => {
    const organizationId = getOrganizationId();
    try {
      await HrmAssetService.generateQRCode(organizationId, assetId);
      message.success('QR code generated');
    } catch {
      message.error('Failed to generate QR code');
    }
  };

  return (
    <Space direction="vertical" size={4} align="center">
      {qrUrl && showQr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrUrl} alt="QR Code" style={{ width: 80, height: 80, border: '1px solid #f0f0f0' }} />
      ) : (
        <div style={{ width: 80, height: 80, background: '#fafafa', border: '1px dashed #d9d9d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <QrCodeIcon style={{ fontSize: 32, color: '#bfbfbf' }} />
        </div>
      )}
      <Space size={4}>
        {qrUrl ? (
          <>
            {!showQr && (
              <Button size="small" onClick={() => setShowQr(true)} icon={<QrCodeIcon style={{ fontSize: 14 }} />}>
                View QR
              </Button>
            )}
            <Button size="small" href={qrUrl} target="_blank" download={`${assetId}.png`}>PNG</Button>
          </>
        ) : (
          <Button size="small" onClick={handleGenerate} icon={<QrCodeIcon style={{ fontSize: 14 }} />}>
            Generate QR
          </Button>
        )}
      </Space>
    </Space>
  );
}
