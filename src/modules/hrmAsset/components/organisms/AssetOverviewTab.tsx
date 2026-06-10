'use client';

import { useState } from 'react';
import { Descriptions, Button, Space, Popconfirm, Select, Modal, Input, message } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import AssetStatusBadge from '../atoms/AssetStatusBadge';
import QrDownloadButton from '../atoms/QrDownloadButton';
import WarrantyReminderBanner from '../molecules/WarrantyReminderBanner';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { useHrmAssetData } from '../../hooks/useHrmAssetData';
import { useEmployeeIdentity } from '../../../hrmAccess/hooks/useEmployeeIdentity';
import { formatDate, formatCurrency } from '../../utils/assetHelpers';
import type { Asset, AssetStatus } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/AssetDetail.module.css';

interface AssetOverviewTabProps {
  asset: Asset;
  canEdit: boolean;
  canAssign: boolean;
}

// Manual status transitions. Note: WORKING is intentionally NOT a manual
// target — an asset becomes WORKING only by being allocated to a user. So a
// repaired/damaged asset goes back to IN_STORE first, and is then allocated.
const STATUS_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  IN_STORE: ['UNDER_REPAIR', 'DAMAGED', 'LOST', 'RETIRED'],
  WORKING: ['IN_STORE', 'UNDER_REPAIR', 'DAMAGED', 'LOST', 'RETIRED'],
  UNDER_REPAIR: ['IN_STORE', 'DAMAGED', 'RETIRED'],
  DAMAGED: ['UNDER_REPAIR', 'IN_STORE', 'RETIRED'],
  LOST: ['IN_STORE', 'RETIRED'],
  RETIRED: [],
};

export default function AssetOverviewTab({ asset, canEdit, canAssign }: AssetOverviewTabProps) {
  const { updateAssetInList, openReturnModal } = useHrmAssetStore();
  const { loadDashboard } = useHrmAssetData();
  const identity = useEmployeeIdentity();
  const warrantyAttr = (asset.attributes ?? []).find((a) => a.attrName.toLowerCase().includes('warranty'));

  // The signed-in employee currently holds this asset → they may raise a
  // RETURN request that routes through the approval workflow. (Distinct from
  // the admin "Unassign / Return" override below, which is immediate.)
  const isHolder = !!identity.employeeCode && asset.currentHolderEmployeeId === identity.employeeCode;
  const [returnReqOpen, setReturnReqOpen] = useState(false);
  const [returnPurpose, setReturnPurpose] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const handleRequestReturn = async () => {
    if (!identity.isReady) {
      message.error('Your employee profile is still loading — please try again in a moment');
      return;
    }
    setSubmittingReturn(true);
    try {
      await HrmAssetService.createAssetRequest({
        organizationId: getOrganizationId(),
        employeeId: identity.employeeCode,
        employeeName: identity.fullName,
        categoryCode: asset.categoryCode,
        quantity: 1,
        purpose: returnPurpose.trim() || `Return of ${asset.assetName}`,
        // Supervisor left blank — the backend resolves the approver from the
        // employee's reporting manager (same as the new-request flow).
        supervisorId: '',
        supervisorName: '',
        createdBy: identity.employeeCode,
        requestType: 'RETURN',
        // Send both keys — the backend validates RETURN requests on the asset
        // reference (error ASSET_REQ_010 when missing); which key is canonical
        // is being settled in the backend v2 doc.
        assetId: asset.assetId,
        linkedAssetId: asset.assetId,
      });
      message.success('Return request submitted for approval');
      setReturnReqOpen(false);
      setReturnPurpose('');
    } catch {
      message.error('Failed to submit return request');
    } finally {
      setSubmittingReturn(false);
    }
  };

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
      // Status moved between buckets (e.g. WORKING → UNDER_REPAIR), so refresh
      // the dashboard tiles.
      loadDashboard();
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
            <Can I="edit" object="asset_record">
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
              <Space size={8} style={{ marginTop: 8 }} wrap>
                {/* Holder self-service: raise a return request through approval. */}
                {isHolder && (
                  <Can I="add" object="asset_request" passIf>
                    <Button size="small" onClick={() => setReturnReqOpen(true)}>
                      Request Return
                    </Button>
                  </Can>
                )}
                {/* Admin override: immediate unassign/return. */}
                {canAssign && (
                  <Can I="edit" object="asset_record">
                    <Button size="small" danger onClick={openReturnModal}>
                      Unassign / Return
                    </Button>
                  </Can>
                )}
              </Space>
            </>
          ) : (
            <span style={{ color: '#8c8c8c' }}>Unassigned</span>
          )}
        </div>

        <div className={styles.overviewCard}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>QR Code</div>
          <QrDownloadButton assetId={asset.assetId} qrUrl={asset.qrCodeBase64 ?? asset.qrDownloadUrl} />
        </div>
      </div>

      <Modal
        title="Request Asset Return"
        open={returnReqOpen}
        onOk={handleRequestReturn}
        onCancel={() => { setReturnReqOpen(false); setReturnPurpose(''); }}
        okText="Submit Request"
        okButtonProps={{ loading: submittingReturn }}
        destroyOnHidden
      >
        <p style={{ marginBottom: 12, color: '#595959' }}>
          Raise a return request for <strong>{asset.assetName}</strong>. It will be routed
          through your reporting hierarchy. The asset is marked Returned only after the
          approval workflow completes.
        </p>
        <Input.TextArea
          rows={3}
          placeholder="Reason / remarks for return (optional)"
          value={returnPurpose}
          onChange={(e) => setReturnPurpose(e.target.value)}
          maxLength={500}
          showCount
        />
      </Modal>
    </div>
  );
}
