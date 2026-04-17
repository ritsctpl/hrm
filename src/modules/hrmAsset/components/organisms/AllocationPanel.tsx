'use client';

import { useState } from 'react';
import { Drawer, Form, Input, DatePicker, Select, Button, Space, message, Spin, Empty } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import dayjs from 'dayjs';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import type { AssetListResponse } from '../../types/api.types';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/AssetForm.module.css';

export default function AllocationPanel() {
  const {
    isAllocationPanelOpen,
    closeAllocationPanel,
    selectedRequest,
    pendingAllocationRequests,
    setPendingAllocationRequests,
    allocatingAsset,
    setAllocatingAsset,
  } = useHrmAssetStore();
  const [form] = Form.useForm();
  const [inStoreAssets, setInStoreAssets] = useState<AssetListResponse[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const loadInStoreAssets = async () => {
    if (!selectedRequest) return;
    const organizationId = getOrganizationId();
    setLoadingAssets(true);
    try {
      const assets = await HrmAssetService.getInStoreByCategory(organizationId, selectedRequest.categoryCode);
      setInStoreAssets(assets);
    } catch {
      message.error('Failed to load available assets');
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setInStoreAssets([]);
    closeAllocationPanel();
  };

  const handleAllocate = async () => {
    const { organizationId, userId } = parseCookies();
    try {
      const values = await form.validateFields();
      setAllocatingAsset(true);
      await HrmAssetService.allocateAsset({
        organizationId: organizationId ?? '',
        requestId: selectedRequest!.requestId,
        assetId: values.assetId,
        allocationDate: dayjs(values.allocationDate).format('YYYY-MM-DD'),
        allocatedBy: userId ?? '',
        remarks: values.remarks,
      });
      setPendingAllocationRequests(
        pendingAllocationRequests.filter((r) => r.requestId !== selectedRequest!.requestId)
      );
      message.success('Asset allocated successfully');
      handleClose();
    } catch {
      message.error('Failed to allocate asset');
    } finally {
      setAllocatingAsset(false);
    }
  };

  return (
    <Drawer
      open={isAllocationPanelOpen}
      onClose={handleClose}
      title="Allocate Asset"
      width={480}
      destroyOnHidden
      afterOpenChange={(open) => { if (open) loadInStoreAssets(); }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Can I="edit">
              <Button type="primary" loading={allocatingAsset} onClick={handleAllocate}>
                Allocate
              </Button>
            </Can>
          </Space>
        </div>
      }
    >
      {selectedRequest && (
        <div className={styles.allocationInfo}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Requested By</span>
            <span>{selectedRequest.employeeName} ({selectedRequest.employeeId})</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Category</span>
            <span>{selectedRequest.categoryName}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Purpose</span>
            <span>{selectedRequest.purpose}</span>
          </div>
        </div>
      )}

      {loadingAssets ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
      ) : inStoreAssets.length === 0 ? (
        <Empty description="No assets in store for this category" style={{ margin: '24px 0' }} />
      ) : (
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Select Asset"
            name="assetId"
            rules={[{ required: true, message: 'Please select an asset' }]}
          >
            <Select
              placeholder="Select an available asset"
              options={inStoreAssets.map((a) => ({
                value: a.assetId,
                label: `${a.assetId} — ${a.assetName}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Allocation Date"
            name="allocationDate"
            rules={[{ required: true, message: 'Allocation date is required' }]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
          </Form.Item>
          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea rows={2} placeholder="Allocation remarks" />
          </Form.Item>
        </Form>
      )}
    </Drawer>
  );
}
