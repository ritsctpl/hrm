'use client';

import { useState } from 'react';
import { Spin, Empty, Button, Form, Input, DatePicker, InputNumber, Checkbox, Drawer, Space, message } from 'antd';
import AddIcon from '@mui/icons-material/Add';
import { parseCookies } from 'nookies';
import dayjs from 'dayjs';
import MaintenanceEventRow from '../molecules/MaintenanceEventRow';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { maintenanceFormRules } from '../../utils/assetValidations';
import type { Asset } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/AssetDetail.module.css';

interface AssetMaintenanceTabProps {
  asset: Asset;
  canAdd: boolean;
}

export default function AssetMaintenanceTab({ asset, canAdd }: AssetMaintenanceTabProps) {
  const { maintenanceHistory, loadingMaintenance, setMaintenanceHistory } = useHrmAssetStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const handleSave = async () => {
    const { organizationId, userId } = parseCookies();
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await HrmAssetService.addMaintenanceEvent({
        organizationId: organizationId ?? '',
        assetId: asset.assetId,
        maintenanceDate: dayjs(values.maintenanceDate).format('YYYY-MM-DD'),
        vendor: values.vendor,
        issue: values.issue,
        actionTaken: values.actionTaken,
        costINR: values.costINR,
        warrantyUsed: values.warrantyUsed ?? false,
        warrantyRef: values.warrantyRef,
        createdBy: userId ?? '',
      });
      setMaintenanceHistory([res, ...maintenanceHistory]);
      message.success('Maintenance event added');
      form.resetFields();
      setDrawerOpen(false);
    } catch {
      message.error('Failed to add maintenance event');
    } finally {
      setSaving(false);
    }
  };

  if (loadingMaintenance) {
    return <div className={styles.spinWrapper}><Spin /></div>;
  }

  return (
    <div className={styles.tabContent}>
      {canAdd && (
        <div style={{ marginBottom: 12 }}>
          <Can I="add">
            <Button
              size="small"
              type="primary"
              icon={<AddIcon style={{ fontSize: 16 }} />}
              onClick={() => setDrawerOpen(true)}
            >
              Add Maintenance Event
            </Button>
          </Can>
        </div>
      )}

      {maintenanceHistory.length === 0 ? (
        <Empty description="No maintenance events" style={{ marginTop: 32 }} />
      ) : (
        maintenanceHistory.map((e) => <MaintenanceEventRow key={e.eventId} event={e} />)
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add Maintenance Event"
        width={440}
        destroyOnHidden
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
              <Can I="add">
                <Button type="primary" loading={saving} onClick={handleSave}>Save</Button>
              </Can>
            </Space>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Date" name="maintenanceDate" rules={maintenanceFormRules.maintenanceDate}>
            <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
          </Form.Item>
          <Form.Item label="Vendor" name="vendor">
            <Input placeholder="Service provider" />
          </Form.Item>
          <Form.Item label="Issue" name="issue" rules={maintenanceFormRules.issue}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Action Taken" name="actionTaken">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Cost (INR)" name="costINR">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="warrantyUsed" valuePropName="checked">
            <Checkbox>Warranty / AMC Used</Checkbox>
          </Form.Item>
          <Form.Item label="Warranty Ref" name="warrantyRef">
            <Input placeholder="AMC / Warranty reference number" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
