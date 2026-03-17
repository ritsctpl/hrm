'use client';

import { useEffect } from 'react';
import { Drawer, Form, Input, InputNumber, DatePicker, Select, Space, Button, message } from 'antd';
import { parseCookies } from 'nookies';
import dayjs from 'dayjs';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { assetFormRules } from '../../utils/assetValidations';
import type { Asset } from '../../types/domain.types';

interface AssetFormProps {
  editAsset?: Asset | null;
}

export default function AssetForm({ editAsset }: AssetFormProps) {
  const {
    isAssetFormOpen,
    closeAssetForm,
    categories,
    savingAsset,
    setSavingAsset,
    assets,
    setAssets,
    updateAssetInList,
  } = useHrmAssetStore();
  const [form] = Form.useForm();

  const isEdit = !!editAsset;

  useEffect(() => {
    if (isAssetFormOpen && editAsset) {
      form.setFieldsValue({
        ...editAsset,
        purchaseDate: editAsset.purchaseDate ? dayjs(editAsset.purchaseDate) : undefined,
        invoiceDate: editAsset.invoiceDate ? dayjs(editAsset.invoiceDate) : undefined,
      });
    }
  }, [isAssetFormOpen, editAsset, form]);

  const handleClose = () => {
    form.resetFields();
    closeAssetForm();
  };

  const handleSave = async () => {
    const { site, userId } = parseCookies();
    try {
      const values = await form.validateFields();
      setSavingAsset(true);
      const payload = {
        site: site ?? '',
        categoryCode: values.categoryCode,
        assetName: values.assetName,
        purchaseValueINR: values.purchaseValueINR,
        purchaseDate: dayjs(values.purchaseDate).format('YYYY-MM-DD'),
        vendor: values.vendor,
        invoiceNo: values.invoiceNo,
        invoiceDate: dayjs(values.invoiceDate).format('YYYY-MM-DD'),
        location: values.location,
        createdBy: userId ?? 'system',
        ...(isEdit ? { assetId: editAsset!.assetId } : {}),
      };

      const res = isEdit
        ? await HrmAssetService.updateAsset(payload)
        : await HrmAssetService.createAsset(payload);

      if (isEdit) {
        updateAssetInList(res.assetId, res as Partial<Asset>);
        message.success('Asset updated');
      } else {
        const newAsset: Asset = {
          ...res,
          attributes: res.attributes ?? [],
          attachments: res.attachments ?? [],
        };
        setAssets([newAsset, ...assets]);
        message.success('Asset created');
      }
      handleClose();
    } catch {
      message.error(`Failed to ${isEdit ? 'update' : 'create'} asset`);
    } finally {
      setSavingAsset(false);
    }
  };

  return (
    <Drawer
      open={isAssetFormOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Asset' : 'Add New Asset'}
      width={520}
      destroyOnHidden
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" loading={savingAsset} onClick={handleSave}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Category" name="categoryCode" rules={assetFormRules.categoryCode}>
          <Select
            disabled={isEdit}
            placeholder="Select category"
            options={categories.map((c) => ({ value: c.categoryCode, label: c.categoryName }))}
          />
        </Form.Item>
        <Form.Item label="Asset Name" name="assetName" rules={assetFormRules.assetName}>
          <Input placeholder="e.g. Dell Latitude 5420 Laptop" />
        </Form.Item>
        <Form.Item label="Purchase Value (INR)" name="purchaseValueINR" rules={assetFormRules.purchaseValueINR}>
          <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
        </Form.Item>
        <Form.Item label="Purchase Date" name="purchaseDate" rules={assetFormRules.purchaseDate}>
          <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
        </Form.Item>
        <Form.Item label="Vendor" name="vendor" rules={assetFormRules.vendor}>
          <Input placeholder="Supplier / vendor name" />
        </Form.Item>
        <Form.Item label="Invoice No" name="invoiceNo" rules={assetFormRules.invoiceNo}>
          <Input placeholder="Invoice number" />
        </Form.Item>
        <Form.Item label="Invoice Date" name="invoiceDate" rules={assetFormRules.invoiceDate}>
          <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
        </Form.Item>
        <Form.Item label="Location" name="location">
          <Input placeholder="Storage location (optional)" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
