'use client';

import { Modal, Form, Input, DatePicker, message } from 'antd';
import { parseCookies } from 'nookies';
import dayjs from 'dayjs';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';

export default function ReturnAssetModal() {
  const {
    isReturnModalOpen,
    closeReturnModal,
    selectedAsset,
    updateAssetInList,
  } = useHrmAssetStore();
  const [form] = Form.useForm();

  const handleOk = async () => {
    const { site, userId } = parseCookies();
    try {
      const values = await form.validateFields();
      await HrmAssetService.returnAsset({
        site: site ?? '',
        assetId: selectedAsset!.assetId,
        returnedBy: userId ?? '',
        returnDate: dayjs(values.returnDate).format('YYYY-MM-DD'),
        returnRemarks: values.returnRemarks,
        handoverReceiptNo: values.handoverReceiptNo,
      });
      updateAssetInList(selectedAsset!.assetId, {
        currentHolderEmployeeId: undefined,
        currentHolderName: undefined,
        status: 'IN_STORE',
      });
      message.success('Asset returned successfully');
      form.resetFields();
      closeReturnModal();
    } catch {
      message.error('Failed to return asset');
    }
  };

  return (
    <Modal
      open={isReturnModalOpen}
      title="Return / Unassign Asset"
      onCancel={() => { form.resetFields(); closeReturnModal(); }}
      onOk={handleOk}
      okText="Confirm Return"
      destroyOnClose
    >
      {selectedAsset && (
        <p style={{ marginBottom: 16, color: '#595959' }}>
          Returning <strong>{selectedAsset.assetName}</strong> from{' '}
          <strong>{selectedAsset.currentHolderName}</strong>
        </p>
      )}
      <Form form={form} layout="vertical">
        <Form.Item
          label="Return Date"
          name="returnDate"
          rules={[{ required: true, message: 'Return date is required' }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
        </Form.Item>
        <Form.Item label="Handover Receipt No" name="handoverReceiptNo">
          <Input placeholder="Receipt number (optional)" />
        </Form.Item>
        <Form.Item label="Remarks" name="returnRemarks">
          <Input.TextArea rows={2} placeholder="Return remarks (optional)" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
