'use client';

import { Alert, Typography } from 'antd';
import { formatDate } from '../../utils/assetHelpers';

interface WarrantyReminderBannerProps {
  expiryDate: string;
  label?: string;
}

export default function WarrantyReminderBanner({ expiryDate, label = 'Warranty' }: WarrantyReminderBannerProps) {
  const d = new Date(expiryDate);
  const today = new Date();
  const daysLeft = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft > 90) return null;

  return (
    <Alert
      type={daysLeft <= 0 ? 'error' : 'warning'}
      showIcon
      message={
        <Typography.Text>
          {label} {daysLeft <= 0 ? 'expired' : `expiring in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`} —{' '}
          {formatDate(expiryDate)}
        </Typography.Text>
      }
      style={{ marginBottom: 8 }}
    />
  );
}
