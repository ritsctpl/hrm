'use client';

import { Spin, Empty, Button, Popconfirm, message, Descriptions } from 'antd';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import DepreciationSnapshotRow from '../molecules/DepreciationSnapshotRow';
import DepreciationBadge from '../atoms/DepreciationBadge';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { formatCurrency, formatDate } from '../../utils/assetHelpers';
import type { Asset, AssetCategory } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/AssetDetail.module.css';

interface AssetDepreciationTabProps {
  asset: Asset;
  category?: AssetCategory;
  canRunDepreciation: boolean;
}

export default function AssetDepreciationTab({ asset, category, canRunDepreciation }: AssetDepreciationTabProps) {
  const {
    depreciationHistory,
    loadingDepreciation,
    runningDepreciation,
    setRunningDepreciation,
    setDepreciationHistory,
    updateAssetInList,
  } = useHrmAssetStore();

  const handleRunDepreciation = async () => {
    const organizationId = getOrganizationId();
    const { userId } = parseCookies();
    setRunningDepreciation(true);
    try {
      const result = await HrmAssetService.runDepreciation({
        organizationId,
        runBy: userId ?? '',
        asOfDate: new Date().toISOString().split('T')[0],
        prorateMidYear: false,
      });
      if (result.details?.length) {
        const myDetail = result.details.find((d) => d.assetId === asset.assetId);
        if (myDetail) {
          updateAssetInList(asset.assetId, {
            presentValueINR: myDetail.presentValue,
            lastDepreciationDate: result.asOfDate,
          });
        }
      }
      message.success('Depreciation run completed');
    } catch {
      message.error('Failed to run depreciation');
    } finally {
      setRunningDepreciation(false);
    }
  };

  if (loadingDepreciation) {
    return <div className={styles.spinWrapper}><Spin /></div>;
  }

  return (
    <div className={styles.tabContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <Descriptions column={2} size="small" bordered style={{ flex: 1, marginRight: 16 }}>
          <Descriptions.Item label="Purchase Value">{formatCurrency(asset.purchaseValueINR)}</Descriptions.Item>
          <Descriptions.Item label="Present Value">
            <DepreciationBadge
              purchaseValueINR={asset.purchaseValueINR}
              presentValueINR={asset.presentValueINR}
            />
          </Descriptions.Item>
          {category && (
            <>
              <Descriptions.Item label="WDV Rate">{category.wdvRatePct}%</Descriptions.Item>
              <Descriptions.Item label="Method">Written Down Value</Descriptions.Item>
              {category.usefulLifeYears && (
                <Descriptions.Item label="Useful Life">{category.usefulLifeYears} years</Descriptions.Item>
              )}
              {category.salvageValueINR != null && (
                <Descriptions.Item label="Salvage Value">{formatCurrency(category.salvageValueINR)}</Descriptions.Item>
              )}
            </>
          )}
          {asset.lastDepreciationDate && (
            <Descriptions.Item label="Last Run">{formatDate(asset.lastDepreciationDate)}</Descriptions.Item>
          )}
        </Descriptions>

        {canRunDepreciation && (
          <Can I="edit">
            <Popconfirm
              title="Run depreciation for this asset?"
              description="This will create a new depreciation snapshot as of today."
              onConfirm={handleRunDepreciation}
              okText="Run"
              cancelText="Cancel"
            >
              <Button
                type="primary"
                size="small"
                icon={<PlayArrowIcon style={{ fontSize: 16 }} />}
                loading={runningDepreciation}
              >
                Run Depreciation
              </Button>
            </Popconfirm>
          </Can>
        )}
      </div>

      {depreciationHistory.length === 0 ? (
        <Empty description="No depreciation history" style={{ marginTop: 24 }} />
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, padding: '6px 0', fontWeight: 600, fontSize: 12, color: '#595959', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ minWidth: 100 }}>As Of Date</span>
            <span style={{ minWidth: 110 }}>Prev Book Value</span>
            <span style={{ minWidth: 60 }}>Rate %</span>
            <span style={{ minWidth: 110 }}>Present Value</span>
            <span style={{ flex: 1 }}>Run By</span>
          </div>
          {depreciationHistory.map((snap) => (
            <DepreciationSnapshotRow key={snap.snapId} snapshot={snap} />
          ))}
        </>
      )}
    </div>
  );
}
