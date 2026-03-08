'use client';

import React from 'react';
import { Tabs, Button, Space, Typography } from 'antd';
import { CloseOutlined, EditOutlined } from '@ant-design/icons';
import { useHrmAssetStore } from './stores/hrmAssetStore';
import AssetOverviewTab from './components/organisms/AssetOverviewTab';
import AssetAttributesTab from './components/organisms/AssetAttributesTab';
import AssetAttachmentsTab from './components/organisms/AssetAttachmentsTab';
import AssetCustodyHistoryTab from './components/organisms/AssetCustodyHistoryTab';
import AssetMaintenanceTab from './components/organisms/AssetMaintenanceTab';
import AssetDepreciationTab from './components/organisms/AssetDepreciationTab';
import AllocationPanel from './components/organisms/AllocationPanel';
import ReturnAssetModal from './components/organisms/ReturnAssetModal';

interface HrmAssetScreenProps {
  canEdit?: boolean;
  canAssign?: boolean;
}

const HrmAssetScreen: React.FC<HrmAssetScreenProps> = ({
  canEdit = true,
  canAssign = true,
}) => {
  const store = useHrmAssetStore();
  const { selectedAsset, activeDetailTab, setActiveDetailTab, setSelectedAsset, openAssetForm } = store;

  if (!selectedAsset) return null;

  const tabItems = [
    {
      key: 'overview' as const,
      label: 'Overview',
      children: (
        <AssetOverviewTab
          asset={selectedAsset}
          canEdit={canEdit}
          canAssign={canAssign}
        />
      ),
    },
    {
      key: 'attributes' as const,
      label: 'Attributes',
      children: (
        <AssetAttributesTab
          asset={selectedAsset}
          canEdit={canEdit}
        />
      ),
    },
    {
      key: 'attachments' as const,
      label: 'Attachments',
      children: <AssetAttachmentsTab asset={selectedAsset} canUpload={canEdit} />,
    },
    {
      key: 'custody' as const,
      label: 'Custody History',
      children: <AssetCustodyHistoryTab />,
    },
    {
      key: 'maintenance' as const,
      label: 'Maintenance',
      children: <AssetMaintenanceTab asset={selectedAsset} canAdd={canEdit} />,
    },
    {
      key: 'depreciation' as const,
      label: 'Depreciation',
      children: <AssetDepreciationTab asset={selectedAsset} canRunDepreciation={canEdit} />,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          flexShrink: 0,
        }}
      >
        <div>
          <Typography.Text strong style={{ fontSize: 15 }}>
            {selectedAsset.assetName}
          </Typography.Text>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            {selectedAsset.assetId} · {selectedAsset.categoryName}
          </div>
        </div>
        <Space>
          {canEdit && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={openAssetForm}
            >
              Edit
            </Button>
          )}
          <Button
            size="small"
            icon={<CloseOutlined />}
            onClick={() => setSelectedAsset(null)}
          />
        </Space>
      </div>

      <Tabs
        activeKey={activeDetailTab}
        onChange={(k) => setActiveDetailTab(k as typeof activeDetailTab)}
        items={tabItems}
        size="small"
        style={{ flex: 1, overflow: 'hidden', padding: '0 16px' }}
        destroyOnHidden={false}
      />

      {store.isAllocationPanelOpen && <AllocationPanel />}
      {store.isReturnModalOpen && <ReturnAssetModal />}
    </div>
  );
};

export default HrmAssetScreen;
