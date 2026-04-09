'use client';

import { Spin, Empty } from 'antd';
import AssetListRow from '../molecules/AssetListRow';
import type { AssetMasterListProps } from '../../types/ui.types';
import type { Asset } from '../../types/domain.types';
import styles from '../../styles/AssetList.module.css';

export default function AssetMasterList({ assets: rawAssets, loading, selectedAssetId, onSelect }: AssetMasterListProps) {
  const assets = Array.isArray(rawAssets) ? rawAssets : [];

  if (loading) {
    return (
      <div className={styles.spinWrapper}>
        <Spin />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <Empty description="No assets found. Try adjusting your filters or create a new asset." style={{ marginTop: 48 }} />
    );
  }

  return (
    <div className={styles.masterList}>
      <div className={styles.listHeader}>
        <span>Assets</span>
        <span className={styles.listCount}>{assets.length}</span>
      </div>
      <div className={styles.listBody}>
        {assets.map((asset: Asset) => (
          <AssetListRow
            key={asset.assetId}
            asset={asset}
            isSelected={asset.assetId === selectedAssetId}
            onClick={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
