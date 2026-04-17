'use client';

import { Button, Space, message } from 'antd';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { HrmAssetService } from '../../services/hrmAssetService';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';

interface QrDownloadButtonProps {
  assetId: string;
  qrUrl?: string;
}

export default function QrDownloadButton({ assetId, qrUrl }: QrDownloadButtonProps) {
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
      {qrUrl ? (
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
            <Button size="small" href={qrUrl} download={`${assetId}.png`}>PNG</Button>
            <Button size="small" onClick={() => {
              const link = document.createElement('a');
              link.href = qrUrl!;
              link.download = `${assetId}-qr.pdf`;
              link.click();
            }}>PDF</Button>
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
