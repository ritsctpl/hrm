'use client';

import { Tag, Space } from 'antd';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { REQUEST_STATUS_CONFIG } from '../../utils/assetConstants';
import type { AssetRequestStatusBadgeProps } from '../../types/ui.types';

export default function AssetRequestStatusBadge({ status, escalated }: AssetRequestStatusBadgeProps) {
  const config = REQUEST_STATUS_CONFIG[status] ?? { label: status, color: 'default' };
  return (
    <Space size={4}>
      <Tag color={config.color} style={{ fontWeight: 600, fontSize: 12 }}>{config.label}</Tag>
      {escalated && (
        <Tag color="red" icon={<WarningAmberIcon style={{ fontSize: 12 }} />}>Escalated</Tag>
      )}
    </Space>
  );
}
