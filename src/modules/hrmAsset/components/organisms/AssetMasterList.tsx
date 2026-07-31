'use client';

import { Spin, Empty, Button } from 'antd';
import AssetListRow from '../molecules/AssetListRow';
import { getDirectAssignBlockReason } from '../../utils/assetHelpers';
import type { AssetMasterListProps } from '../../types/ui.types';
import type { Asset } from '../../types/domain.types';
import styles from '../../styles/AssetList.module.css';

export default function AssetMasterList({
  assets: rawAssets,
  loading,
  selectedAssetId,
  onSelect,
  selectable,
  checkedAssetIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  selectionLimit,
}: AssetMasterListProps) {
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

  const checked = checkedAssetIds ?? [];
  // Only assets that are actually in a state to be handed over get a tick box.
  const assignableIds = selectable
    ? assets.filter((a: Asset) => !getDirectAssignBlockReason(a)).map((a: Asset) => a.assetId)
    : [];
  // "Select all" fills up to the cap; beyond that the user prunes by hand,
  // which is better than silently dropping the tail of their selection.
  const selectAllIds = selectionLimit ? assignableIds.slice(0, selectionLimit) : assignableIds;

  return (
    <div className={styles.masterList}>
      <div className={styles.listHeader}>
        <span>Assets</span>
        <span className={styles.listCount}>{assets.length}</span>
        {selectable && assignableIds.length > 0 && (
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
            {checked.length > 0 && (
              <Button type="link" size="small" style={{ padding: 0 }} onClick={onClearSelection}>
                Clear ({checked.length})
              </Button>
            )}
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => onSelectAll?.(selectAllIds)}
            >
              Select all
            </Button>
          </span>
        )}
      </div>
      <div className={styles.listBody}>
        {assets.map((asset: Asset) => (
          <AssetListRow
            key={asset.assetId}
            asset={asset}
            isSelected={asset.assetId === selectedAssetId}
            onClick={onSelect}
            selectable={selectable && !getDirectAssignBlockReason(asset)}
            isChecked={checked.includes(asset.assetId)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </div>
  );
}
