'use client';

import { useEffect, useState } from 'react';
import { Drawer, Form, Input, InputNumber, Select, Space, Button, message } from 'antd';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmEmployeeService } from '@/modules/hrmEmployee/services/hrmEmployeeService';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { requestFormRules } from '../../utils/assetValidations';
import Can from '../../../hrmAccess/components/Can';
import { useEmployeeIdentity } from '../../../hrmAccess/hooks/useEmployeeIdentity';

export default function AssetRequestForm() {
  const {
    isRequestFormOpen,
    closeRequestForm,
    categories,
    myRequests,
    setMyRequests,
    savingRequest,
    setSavingRequest,
  } = useHrmAssetStore();
  const [form] = Form.useForm();

  // Canonical signed-in employee (employeeCode + name + handle).
  const identity = useEmployeeIdentity();
  // Reporting manager (supervisor) resolved from the employee's official
  // details — the request routes to this person's approval queue.
  const [supervisor, setSupervisor] = useState<{ id: string; name: string }>({ id: '', name: '' });

  // Load the supervisor when the drawer opens and identity is resolved.
  useEffect(() => {
    if (!isRequestFormOpen || !identity.isReady || !identity.handle) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await HrmEmployeeService.fetchProfile(getOrganizationId(), identity.handle);
        if (!cancelled) {
          setSupervisor({
            id: profile.officialDetails?.reportingManager ?? '',
            name: profile.officialDetails?.reportingManagerName ?? '',
          });
        }
      } catch {
        // Leave blank — backend may still resolve the approver from employeeId.
      }
    })();
    return () => { cancelled = true; };
  }, [isRequestFormOpen, identity.isReady, identity.handle]);

  const handleClose = () => {
    form.resetFields();
    closeRequestForm();
  };

  const handleSubmit = async () => {
    const organizationId = getOrganizationId();
    try {
      const values = await form.validateFields();
      setSavingRequest(true);
      const res = await HrmAssetService.createAssetRequest({
        organizationId,
        employeeId: identity.employeeCode,
        employeeName: identity.fullName,
        categoryCode: values.categoryCode,
        quantity: values.quantity,
        purpose: values.purpose,
        remarks: values.remarks,
        supervisorId: supervisor.id,
        supervisorName: supervisor.name,
        createdBy: identity.employeeCode,
      });
      const newRequest = {
        ...res,
        approvalHistory: res.approvalHistory ?? [],
      };
      setMyRequests([newRequest, ...myRequests]);
      message.success('Asset request submitted');
      handleClose();
    } catch {
      message.error('Failed to submit asset request');
    } finally {
      setSavingRequest(false);
    }
  };

  return (
    <Drawer
      open={isRequestFormOpen}
      onClose={handleClose}
      title="New Asset Request"
      width={480}
      destroyOnHidden
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            {/* Self-service: every module user can submit their own request,
                so the action stays available even without an asset_request grant. */}
            <Can I="add" object="asset_request" passIf>
              <Button type="primary" loading={savingRequest} onClick={handleSubmit}>
                Submit Request
              </Button>
            </Can>
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Reporting Manager (Approver)">
          <Input
            disabled
            value={
              supervisor.name
                ? `${supervisor.name}${supervisor.id ? ` (${supervisor.id})` : ''}`
                : supervisor.id || 'Not assigned'
            }
          />
        </Form.Item>
        <Form.Item label="Asset Category" name="categoryCode" rules={requestFormRules.categoryCode}>
          <Select
            placeholder="Select category"
            options={categories.map((c) => ({ value: c.categoryCode, label: c.categoryName }))}
          />
        </Form.Item>
        <Form.Item label="Quantity" name="quantity" rules={requestFormRules.quantity} initialValue={1}>
          <InputNumber style={{ width: '100%' }} min={1} />
        </Form.Item>
        <Form.Item label="Purpose" name="purpose" rules={requestFormRules.purpose}>
          <Input.TextArea rows={3} placeholder="Describe the business need for this asset" />
        </Form.Item>
        <Form.Item label="Additional Remarks" name="remarks">
          <Input.TextArea rows={2} placeholder="Any specific requirements (optional)" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
