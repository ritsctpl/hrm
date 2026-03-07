'use client';

import { Typography } from 'antd';
import AssetRequestStatusBadge from '../atoms/AssetRequestStatusBadge';
import AssetCategoryIcon from '../atoms/AssetCategoryIcon';
import { formatDate } from '../../utils/assetHelpers';
import type { AssetRequestCardProps } from '../../types/ui.types';
import styles from '../../styles/AssetList.module.css';

export default function AssetRequestCard({ request, isSelected, onClick }: AssetRequestCardProps) {
  return (
    <div
      className={`${styles.listRow} ${isSelected ? styles.listRowSelected : ''}`}
      onClick={() => onClick(request)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(request)}
    >
      <div className={styles.listRowTop}>
        <AssetCategoryIcon categoryCode={request.categoryCode} size={16} />
        <Typography.Text strong style={{ fontSize: 13, flex: 1 }} ellipsis>
          {request.requestId}
        </Typography.Text>
        <AssetRequestStatusBadge status={request.status} escalated={request.escalated} />
      </div>
      <div className={styles.listRowMeta}>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {request.categoryName} · Qty: {request.quantity}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {formatDate(request.createdDateTime)}
        </Typography.Text>
      </div>
    </div>
  );
}
