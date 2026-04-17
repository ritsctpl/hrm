'use client';

import { useEffect } from 'react';
import { Tabs, Button, Space, Spin, Popconfirm, message } from 'antd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import AssetOverviewTab from './AssetOverviewTab';
import AssetAttributesTab from './AssetAttributesTab';
import AssetAttachmentsTab from './AssetAttachmentsTab';
import AssetCustodyHistoryTab from './AssetCustodyHistoryTab';
import AssetMaintenanceTab from './AssetMaintenanceTab';
import AssetDepreciationTab from './AssetDepreciationTab';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { DETAIL_TABS } from '../../utils/assetConstants';
import type { AssetDetailTab, AssetCategory } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/AssetDetail.module.css';

interface AssetDetailPanelProps {
  canEdit: boolean;
  canAssign: boolean;
  canMaintain: boolean;
  canRunDepreciation: boolean;
  onEditAsset?: () => void;
}

export default function AssetDetailPanel({
  canEdit,
  canAssign,
  canMaintain,
  canRunDepreciation,
  onEditAsset,
}: AssetDetailPanelProps) {
  const {
    selectedAsset,
    activeDetailTab,
    setActiveDetailTab,
    categories,
    custodyHistory,
    maintenanceHistory,
    depreciationHistory,
    loadingCustody,
    loadingMaintenance,
    loadingDepreciation,
    setCustodyHistory,
    setMaintenanceHistory,
    setDepreciationHistory,
    setLoadingCustody,
    setLoadingMaintenance,
    setLoadingDepreciation,
    assets,
    setAssets,
    setSelectedAsset,
  } = useHrmAssetStore();

  const category: AssetCategory | undefined = categories.find(
    (c) => c.categoryCode === selectedAsset?.categoryCode
  );

  useEffect(() => {
    if (!selectedAsset) return;
    const organizationId = getOrganizationId();

    const loadCustody = async () => {
      setLoadingCustody(true);
      try {
        const history = await HrmAssetService.getCustodyHistory(organizationId, selectedAsset.assetId);
        setCustodyHistory(history);
      } catch {
        setCustodyHistory([]);
      } finally {
        setLoadingCustody(false);
      }
    };

    const loadMaintenance = async () => {
      setLoadingMaintenance(true);
      try {
        const history = await HrmAssetService.getMaintenanceHistory(organizationId, selectedAsset.assetId);
        setMaintenanceHistory(history);
      } catch {
        setMaintenanceHistory([]);
      } finally {
        setLoadingMaintenance(false);
      }
    };

    const loadDepreciation = async () => {
      setLoadingDepreciation(true);
      try {
        const history = await HrmAssetService.getDepreciationHistory(organizationId, selectedAsset.assetId);
        setDepreciationHistory(history);
      } catch {
        setDepreciationHistory([]);
      } finally {
        setLoadingDepreciation(false);
      }
    };

    loadCustody();
    loadMaintenance();
    loadDepreciation();
  }, [selectedAsset?.assetId]);

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;
    const { organizationId, userId } = parseCookies();
    try {
      await HrmAssetService.updateStatus({
        organizationId: organizationId ?? '',
        assetId: selectedAsset.assetId,
        newStatus: 'RETIRED',
        updatedBy: userId ?? '',
        remarks: 'Retired via delete action',
      });
      setAssets(assets.filter((a) => a.assetId !== selectedAsset.assetId));
      setSelectedAsset(null);
      message.success('Asset retired');
    } catch {
      message.error('Failed to retire asset');
    }
  };

  if (!selectedAsset) {
    return (
      <div className={styles.emptyDetail}>
        <span style={{ color: '#bfbfbf' }}>Select an asset to view details</span>
      </div>
    );
  }

  const tabItems = DETAIL_TABS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    children: (() => {
      switch (tab.key as AssetDetailTab) {
        case 'overview':
          return <AssetOverviewTab asset={selectedAsset} canEdit={canEdit} canAssign={canAssign} />;
        case 'attributes':
          return (
            <AssetAttributesTab
              asset={selectedAsset}
              category={category}
              canEdit={canEdit}
            />
          );
        case 'attachments':
          return <AssetAttachmentsTab asset={selectedAsset} canUpload={canEdit} />;
        case 'custody':
          return <AssetCustodyHistoryTab />;
        case 'maintenance':
          return <AssetMaintenanceTab asset={selectedAsset} canAdd={canMaintain} />;
        case 'depreciation':
          return (
            <AssetDepreciationTab
              asset={selectedAsset}
              category={category}
              canRunDepreciation={canRunDepreciation}
            />
          );
        default:
          return null;
      }
    })(),
  }));

  return (
    <div className={styles.detailPanel}>
      <div className={styles.detailHeader}>
        <div>
          <div className={styles.detailTitle}>{selectedAsset.assetName}</div>
          <div className={styles.detailSubtitle}>
            {selectedAsset.assetId}
          </div>
        </div>
        {canEdit && (
          <Space>
            <Can I="edit">
              <Button
                size="small"
                icon={<EditIcon style={{ fontSize: 16 }} />}
                onClick={onEditAsset}
              >
                Edit
              </Button>
            </Can>
            <Can I="edit">
              <Popconfirm
                title="Retire this asset?"
                description="This will move the asset to RETIRED status."
                onConfirm={handleDeleteAsset}
                okText="Retire"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger icon={<DeleteIcon style={{ fontSize: 16 }} />}>
                  Retire
                </Button>
              </Popconfirm>
            </Can>
          </Space>
        )}
      </div>

      <Tabs
        activeKey={activeDetailTab}
        onChange={(key) => setActiveDetailTab(key as AssetDetailTab)}
        items={tabItems}
        size="small"
        style={{ flex: 1 }}
      />
    </div>
  );
}
