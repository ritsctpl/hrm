'use client';

import { Typography, Dropdown, Button, Tooltip, Checkbox } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import AssetStatusBadge from '../atoms/AssetStatusBadge';
import AssetCategoryIcon from '../atoms/AssetCategoryIcon';
import DepreciationBadge from '../atoms/DepreciationBadge';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { useCanDirectAssign } from '../../hooks/useCanDirectAssign';
import { getDirectAssignBlockReason } from '../../utils/assetHelpers';
import type { AssetListRowProps } from '../../types/ui.types';
import styles from '../../styles/AssetList.module.css';

export default function AssetListRow({
  asset,
  isSelected,
  onClick,
  selectable,
  isChecked,
  onToggleSelect,
}: AssetListRowProps) {
  const openAssignModal = useHrmAssetStore((s) => s.openAssignModal);
  const canDirectAssign = useCanDirectAssign();
  const assignBlockReason = getDirectAssignBlockReason(asset);

  return (
    <div
      className={`${styles.listRow} ${isSelected ? styles.listRowSelected : ''}`}
      onClick={() => onClick(asset)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(asset)}
    >
      <div className={styles.listRowTop}>
        {/* Bulk-assignment tick. Only rendered for assignable rows, so the
            toolbar never has to reason about a selection it cannot act on. */}
        {selectable && (
          <Checkbox
            checked={!!isChecked}
            aria-label={`Select ${asset.assetId} for bulk assignment`}
            onClick={(e) => e.stopPropagation()}
            onChange={() => onToggleSelect?.(asset.assetId)}
          />
        )}
        <span className={styles.listRowIcon}>
          <AssetCategoryIcon categoryCode={asset.categoryCode} size={16} />
        </span>
        <Typography.Text strong style={{ fontSize: 13, flex: 1 }} ellipsis>
          {asset.assetName}
        </Typography.Text>
        <AssetStatusBadge status={asset.status} />
        {/* Row action menu. Rendered only for users who can direct-assign —
            it is currently the sole action here, so an empty menu would be
            noise for everyone else. */}
        {canDirectAssign && (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'assign-direct',
                  label: assignBlockReason ? (
                    <Tooltip title={assignBlockReason} placement="left">
                      <span>Assign Directly</span>
                    </Tooltip>
                  ) : (
                    'Assign Directly'
                  ),
                  disabled: !!assignBlockReason,
                },
              ],
              onClick: ({ key, domEvent }) => {
                domEvent.stopPropagation();
                if (key === 'assign-direct') {
                  openAssignModal({ kind: 'asset', assetId: asset.assetId });
                }
              },
            }}
          >
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              aria-label={`Actions for ${asset.assetId}`}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        )}
      </div>
      <div className={styles.listRowMeta}>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>{asset.assetId}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {asset.currentHolderName ?? asset.location ?? '—'}
        </Typography.Text>
        {/* Asset value is intentionally hidden in the listing screen — only a
            non-monetary depreciation indicator is shown. The actual value
            remains visible on the asset detail page (AssetOverviewTab). */}
        {/* <DepreciationBadge
          presentValueINR={asset.presentValueINR}
          purchaseValueINR={asset.purchaseValueINR}
          showAmount={false}
        /> */}
      </div>
    </div>
  );
}
