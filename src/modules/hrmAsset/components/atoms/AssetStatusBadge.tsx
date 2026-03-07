'use client';

import { Tag } from 'antd';
import { ASSET_STATUS_CONFIG } from '../../utils/assetConstants';
import type { AssetStatusBadgeProps } from '../../types/ui.types';

export default function AssetStatusBadge({ status }: AssetStatusBadgeProps) {
  const config = ASSET_STATUS_CONFIG[status] ?? { label: status, color: 'default' };
  return <Tag color={config.color} style={{ fontWeight: 600, fontSize: 12 }}>{config.label}</Tag>;
}
