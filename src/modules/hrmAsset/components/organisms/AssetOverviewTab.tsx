'use client';

import { Descriptions, Button, Space, Popconfirm, Select, message } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import AssetStatusBadge from '../atoms/AssetStatusBadge';
import QrDownloadButton from '../atoms/QrDownloadButton';
import WarrantyReminderBanner from '../molecules/WarrantyReminderBanner';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { formatDate, formatCurrency } from '../../utils/assetHelpers';
import type { Asset, AssetStatus } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/AssetDetail.module.css';

interface AssetOverviewTabProps {
  asset: Asset;
  canEdit: boolean;
  canAssign: boolean;
}

const STATUS_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  IN_STORE: ['UNDER_REPAIR', 'DAMAGED', 'LOST', 'RETIRED'],
  WORKING: ['UNDER_REPAIR', 'DAMAGED', 'LOST', 'RETIRED'],
  UNDER_REPAIR: ['IN_STORE', 'WORKING', 'DAMAGED', 'RETIRED'],
  DAMAGED: ['UNDER_REPAIR', 'RETIRED'],
  LOST: ['RETIRED'],
  RETIRED: [],
};

export default function AssetOverviewTab({ asset, canEdit, canAssign }: AssetOverviewTabProps) {
  const { updateAssetInList, openReturnModal } = useHrmAssetStore();
  const warrantyAttr = (asset.attributes ?? []).find((a) => a.attrName.toLowerCase().includes('warranty'));

  const handleStatusChange = async (newStatus: string) => {
    const organizationId = getOrganizationId();
    const { userId } = parseCookies();
    try {
      await HrmAssetService.updateStatus({
        organizationId,
        assetId: asset.assetId,
        newStatus,
        updatedBy: userId ?? '',
      });
      updateAssetInList(asset.assetId, { status: newStatus as AssetStatus });
      message.success('Status updated');
    } catch {
      message.error('Failed to update status');
    }
  };

  return (
    <div className={styles.overviewGrid}>
      {warrantyAttr && <WarrantyReminderBanner expiryDate={warrantyAttr.attrValue} />}

      <div className={styles.overviewLeft}>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Asset ID">{asset.assetId}</Descriptions.Item>
          <Descriptions.Item label="Name">{asset.assetName}</Descriptions.Item>
          <Descriptions.Item label="Category">{asset.categoryName}</Descriptions.Item>
          <Descriptions.Item label="Purchase Value">{formatCurrency(asset.purchaseValueINR)}</Descriptions.Item>
          <Descriptions.Item label="Purchase Date">{formatDate(asset.purchaseDate)}</Descriptions.Item>
          <Descriptions.Item label="Vendor">{asset.vendor}</Descriptions.Item>
          <Descriptions.Item label="Invoice No">{asset.invoiceNo}</Descriptions.Item>
          <Descriptions.Item label="Invoice Date">{formatDate(asset.invoiceDate)}</Descriptions.Item>
          <Descriptions.Item label="Location">{asset.location ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Present Value">{formatCurrency(asset.presentValueINR)}</Descriptions.Item>
          {asset.lastDepreciationDate && (
            <Descriptions.Item label="Last Depr. Date">{formatDate(asset.lastDepreciationDate)}</Descriptions.Item>
          )}
        </Descriptions>
      </div>

      <div className={styles.overviewRight}>
        <div className={styles.overviewCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>Status</span>
            <AssetStatusBadge status={asset.status} />
          </div>
          {canEdit && STATUS_TRANSITIONS[asset.status].length > 0 && (
            <Can I="edit">
              <Select
                placeholder="Change status..."
                style={{ width: '100%', marginBottom: 8 }}
                onChange={handleStatusChange}
                options={STATUS_TRANSITIONS[asset.status].map((s) => ({ value: s, label: s.replace('_', ' ') }))}
              />
            </Can>
          )}
        </div>

        <div className={styles.overviewCard}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Current Holder</div>
          {asset.currentHolderName ? (
            <>
              <div>{asset.currentHolderName}</div>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>{asset.currentHolderEmployeeId}</div>
              {canAssign && (
                <Can I="edit">
                  <Button size="small" danger onClick={openReturnModal} style={{ marginTop: 8 }}>
                    Unassign / Return
                  </Button>
                </Can>
              )}
            </>
          ) : (
            <span style={{ color: '#8c8c8c' }}>Unassigned</span>
          )}
        </div>

        <div className={styles.overviewCard}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>QR Code</div>
          <QrDownloadButton assetId={asset.assetId} qrUrl={asset.qrDownloadUrl} />
        </div>
      </div>
    </div>
  );
}
