'use client';

import { useEffect } from 'react';
import { Drawer, Form, Input, InputNumber, Select, Space, Button, Typography, message } from 'antd';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { requestFormRules } from '../../utils/assetValidations';
import { useEmployeeIdentity } from '../../../hrmAccess/hooks/useEmployeeIdentity';
import Can from '../../../hrmAccess/components/Can';

const { Text } = Typography;

interface AssetRequestEditDrawerProps {
  /** Called after a successful update so the parent can refresh + re-select. */
  onSaved: (requestId: string) => void;
}

/**
 * Edit a request that is still pending approval. Mirrors the Leave module's
 * AmendLeavePanel — opened from the request detail for the creator while the
 * request is in PENDING_SUPERVISOR / PENDING_ADMIN.
 */
export default function AssetRequestEditDrawer({ onSaved }: AssetRequestEditDrawerProps) {
  const {
    isEditRequestDrawerOpen,
    editingRequest,
    closeEditRequestDrawer,
    categories,
    savingRequest,
    setSavingRequest,
  } = useHrmAssetStore();
  const [form] = Form.useForm();
  const identity = useEmployeeIdentity();

  // Seed the form from the request being edited each time the drawer opens.
  useEffect(() => {
    if (isEditRequestDrawerOpen && editingRequest) {
      form.setFieldsValue({
        categoryCode: editingRequest.categoryCode,
        quantity: editingRequest.quantity,
        purpose: editingRequest.purpose,
        remarks: editingRequest.remarks,
      });
    }
    if (!isEditRequestDrawerOpen) {
      form.resetFields();
    }
  }, [isEditRequestDrawerOpen, editingRequest, form]);

  const handleClose = () => {
    form.resetFields();
    closeEditRequestDrawer();
  };

  const handleSubmit = async () => {
    if (!editingRequest) return;
    if (!identity.isReady) {
      message.error('Your employee profile is still loading — please try again in a moment');
      return;
    }
    try {
      const values = await form.validateFields();
      setSavingRequest(true);
      await HrmAssetService.updateAssetRequest({
        organizationId: getOrganizationId(),
        requestId: editingRequest.requestId,
        categoryCode: values.categoryCode,
        quantity: values.quantity,
        purpose: values.purpose,
        remarks: values.remarks,
        modifiedBy: identity.employeeCode,
      });
      message.success('Request updated');
      const id = editingRequest.requestId;
      handleClose();
      onSaved(id);
    } catch (err: unknown) {
      // antd form validation rejects with errorFields — don't show an API error then.
      if ((err as { errorFields?: unknown })?.errorFields) return;
      message.error('Failed to update request');
    } finally {
      setSavingRequest(false);
    }
  };

  return (
    <Drawer
      open={isEditRequestDrawerOpen}
      onClose={handleClose}
      title="Edit Asset Request"
      width={480}
      destroyOnHidden
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Can I="add" object="asset_request" passIf>
              <Button type="primary" loading={savingRequest} onClick={handleSubmit}>
                Save Changes
              </Button>
            </Can>
          </Space>
        </div>
      }
    >
      {editingRequest && (
        <>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {editingRequest.requestId} · Current status: {editingRequest.status.replace(/_/g, ' ')}
          </Text>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item label="Asset Category" name="categoryCode" rules={requestFormRules.categoryCode}>
              <Select
                placeholder="Select category"
                options={categories.map((c) => ({ value: c.categoryCode, label: c.categoryName }))}
              />
            </Form.Item>
            <Form.Item label="Quantity" name="quantity" rules={requestFormRules.quantity}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
            <Form.Item label="Purpose" name="purpose" rules={requestFormRules.purpose}>
              <Input.TextArea rows={3} placeholder="Describe the business need for this asset" />
            </Form.Item>
            <Form.Item label="Additional Remarks" name="remarks">
              <Input.TextArea rows={2} placeholder="Any specific requirements (optional)" />
            </Form.Item>
          </Form>
        </>
      )}
    </Drawer>
  );
}
