'use client';

import { Drawer, Form, Input, InputNumber, Select, Space, Button, message } from 'antd';
import { parseCookies } from 'nookies';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { requestFormRules } from '../../utils/assetValidations';

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

  const handleClose = () => {
    form.resetFields();
    closeRequestForm();
  };

  const handleSubmit = async () => {
    const { site, userId, employeeName, supervisorId, supervisorName } = parseCookies();
    try {
      const values = await form.validateFields();
      setSavingRequest(true);
      const res = await HrmAssetService.createAssetRequest({
        site: site ?? '',
        employeeId: userId ?? '',
        employeeName: employeeName ?? '',
        categoryCode: values.categoryCode,
        quantity: values.quantity,
        purpose: values.purpose,
        remarks: values.remarks,
        supervisorId: supervisorId ?? '',
        supervisorName: supervisorName ?? '',
        createdBy: userId ?? '',
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
            <Button type="primary" loading={savingRequest} onClick={handleSubmit}>
              Submit Request
            </Button>
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical">
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
