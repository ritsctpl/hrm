'use client';

import React from 'react';
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import AssetMasterDetailTemplate from '../templates/AssetMasterDetailTemplate';
import AssetMasterList from './AssetMasterList';
import HrmAssetScreen from '../../HrmAssetScreen';
import type { Asset } from '../../types/domain.types';

interface AssetTeamHistoryTabProps {
  /** Refetch the supervisor's team-wide asset list (with supervisor: true). */
  onReload: () => void;
}

/**
 * Team History tab — a supervisor's read-only view of the assets held across
 * their reporting team. The list is sourced from /asset/retrieveAll with a
 * hardcoded `supervisor: true` flag (see HrmAssetService.getTeamHistoryAssets)
 * and rendered with the same master-detail layout as the Assets tab: pick a row
 * on the left, inspect the full asset on the right via HrmAssetScreen.
 *
 * Selection reuses the shared `selectedAsset` store slice, so the existing
 * detail-load effect in HrmAssetLanding hydrates the right-hand panel.
 */
const AssetTeamHistoryTab: React.FC<AssetTeamHistoryTabProps> = ({ onReload }) => {
  const store = useHrmAssetStore();

  const leftPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13, color: '#262626' }}>Team Assets</span>
        <Button size="small" icon={<ReloadOutlined />} onClick={onReload} />
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <AssetMasterList
          assets={store.teamHistoryAssets}
          loading={store.loadingTeamHistory}
          selectedAssetId={store.selectedAsset?.assetId}
          onSelect={(asset: Asset) => store.setSelectedAsset(asset)}
        />
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      <AssetMasterDetailTemplate
        leftPanel={leftPanel}
        rightPanel={store.selectedAsset ? <HrmAssetScreen /> : null}
      />
    </div>
  );
};

export default AssetTeamHistoryTab;
