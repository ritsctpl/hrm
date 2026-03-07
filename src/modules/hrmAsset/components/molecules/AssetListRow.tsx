'use client';

import { Typography } from 'antd';
import AssetStatusBadge from '../atoms/AssetStatusBadge';
import AssetCategoryIcon from '../atoms/AssetCategoryIcon';
import DepreciationBadge from '../atoms/DepreciationBadge';
import type { AssetListRowProps } from '../../types/ui.types';
import styles from '../../styles/AssetList.module.css';

export default function AssetListRow({ asset, isSelected, onClick }: AssetListRowProps) {
  return (
    <div
      className={`${styles.listRow} ${isSelected ? styles.listRowSelected : ''}`}
      onClick={() => onClick(asset)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(asset)}
    >
      <div className={styles.listRowTop}>
        <span className={styles.listRowIcon}>
          <AssetCategoryIcon categoryCode={asset.categoryCode} size={16} />
        </span>
        <Typography.Text strong style={{ fontSize: 13, flex: 1 }} ellipsis>
          {asset.assetName}
        </Typography.Text>
        <AssetStatusBadge status={asset.status} />
      </div>
      <div className={styles.listRowMeta}>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>{asset.assetId}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {asset.currentHolderName ?? asset.location ?? '—'}
        </Typography.Text>
        <DepreciationBadge
          presentValueINR={asset.presentValueINR}
          purchaseValueINR={asset.purchaseValueINR}
        />
      </div>
    </div>
  );
}
