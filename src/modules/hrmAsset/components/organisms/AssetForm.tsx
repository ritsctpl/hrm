'use client';

import { useEffect, useMemo } from 'react';
import { Drawer, Form, Input, InputNumber, DatePicker, Select, Button, message, Row, Col, Divider } from 'antd';
import { ShopOutlined, FileTextOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import dayjs from 'dayjs';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { useHrmAssetData } from '../../hooks/useHrmAssetData';
import { assetFormRules } from '../../utils/assetValidations';
import Can from '../../../hrmAccess/components/Can';
import { COUNTRY_STATES } from '../../../hrmOrganization/utils/constants';
import { STATE_CITIES } from '../../../hrmOrganization/utils/locationSearch';
import type { Asset } from '../../types/domain.types';
import type { CreateAssetPayload, UpdateAssetPayload } from '../../types/api.types';

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
    updateAssetInList,
  } = useHrmAssetStore();
  const { loadAssets } = useHrmAssetData();
  const [form] = Form.useForm();

  const isEdit = !!editAsset;

  // Watch country and state for cascade
  const watchCountry = Form.useWatch('country', form) || 'India';
  const watchState = Form.useWatch('state', form);

  const stateOptions = useMemo(() => {
    const states = COUNTRY_STATES[watchCountry] || [];
    return states.map((s) => ({ label: s, value: s }));
  }, [watchCountry]);

  const cityOptions = useMemo(() => {
    const cities = STATE_CITIES[watchState] || [];
    return cities.map((c) => ({ label: c, value: c }));
  }, [watchState]);

  useEffect(() => {
    if (isAssetFormOpen && editAsset) {
      // Parse location string into country/state/city if possible
      const locationParts = (editAsset.location || '').split(',').map((s) => s.trim());
      form.setFieldsValue({
        ...editAsset,
        purchaseDate: editAsset.purchaseDate ? dayjs(editAsset.purchaseDate) : undefined,
        invoiceDate: editAsset.invoiceDate ? dayjs(editAsset.invoiceDate) : undefined,
        country: locationParts[2] || 'India',
        state: locationParts[1] || undefined,
        city: locationParts[0] || undefined,
      });
    }
  }, [isAssetFormOpen, editAsset, form]);

  const handleClose = () => {
    form.resetFields();
    closeAssetForm();
  };

  const handleSave = async () => {
    const organizationId = getOrganizationId();
    const { userId } = parseCookies();
    try {
      const values = await form.validateFields();

      if (values.invoiceDate && values.purchaseDate && dayjs(values.invoiceDate).isBefore(dayjs(values.purchaseDate))) {
        message.error('Invoice date cannot be before purchase date');
        return;
      }

      // Build location string from city, state, country
      const locationParts = [values.city, values.state, values.country].filter(Boolean);
      const location = locationParts.join(', ');

      setSavingAsset(true);

      if (isEdit) {
        const updatePayload: UpdateAssetPayload = {
          organizationId,
          assetId: editAsset!.assetId,
          assetName: values.assetName,
          purchaseValueINR: values.purchaseValueINR,
          purchaseDate: dayjs(values.purchaseDate).format('YYYY-MM-DD'),
          vendor: values.vendor,
          invoiceNo: values.invoiceNo,
          invoiceDate: dayjs(values.invoiceDate).format('YYYY-MM-DD'),
          location,
          modifiedBy: userId ?? 'system',
        };
        await HrmAssetService.updateAsset(updatePayload);
        // Reload full asset so store reflects all persisted fields, not a partial update response
        const fresh = await HrmAssetService.getAsset(organizationId, editAsset!.assetId);
        updateAssetInList(fresh.assetId, fresh as Partial<Asset>);
        message.success('Asset updated');
      } else {
        const createPayload: CreateAssetPayload = {
          organizationId,
          categoryCode: values.categoryCode,
          assetName: values.assetName,
          purchaseValueINR: values.purchaseValueINR,
          purchaseDate: dayjs(values.purchaseDate).format('YYYY-MM-DD'),
          vendor: values.vendor,
          invoiceNo: values.invoiceNo,
          invoiceDate: dayjs(values.invoiceDate).format('YYYY-MM-DD'),
          location,
          createdBy: userId ?? 'system',
        };
        await HrmAssetService.createAsset(createPayload);
        message.success('Asset created');
        handleClose();
        await loadAssets();
        return;
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
      width={560}
      destroyOnHidden
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Can I={isEdit ? 'edit' : 'add'}>
            <Button type="primary" loading={savingAsset} onClick={handleSave}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </Can>
        </div>
      }
      styles={{ body: { padding: '16px 20px' } }}
    >
      <Form form={form} layout="vertical" size="middle" requiredMark="optional" initialValues={{ country: 'India' }}>
        {/* ── Section 1: Asset Info ── */}
        <Divider orientation="left" orientationMargin={0} style={{ margin: '0 0 12px', fontSize: 13, color: '#1890ff' }}>
          <ShopOutlined style={{ marginRight: 6 }} />Asset Info
        </Divider>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="Category" name="categoryCode" rules={assetFormRules.categoryCode}>
              <Select
                placeholder="Select category"
                showSearch
                optionFilterProp="label"
                options={categories.map((c) => ({ value: c.categoryCode, label: c.categoryName }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Asset Name" name="assetName" rules={assetFormRules.assetName}>
              <Input placeholder="e.g. Dell Latitude 5420" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="Purchase Value (INR)" name="purchaseValueINR" rules={assetFormRules.purchaseValueINR}>
              <InputNumber style={{ width: '100%' }} min={0} prefix="₹" placeholder="0" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Purchase Date" name="purchaseDate" rules={assetFormRules.purchaseDate}>
              <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Section 2: Invoice ── */}
        <Divider orientation="left" orientationMargin={0} style={{ margin: '4px 0 12px', fontSize: 13, color: '#1890ff' }}>
          <FileTextOutlined style={{ marginRight: 6 }} />Invoice
        </Divider>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="Vendor" name="vendor" rules={assetFormRules.vendor}>
              <Input placeholder="Supplier name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Invoice No" name="invoiceNo" rules={assetFormRules.invoiceNo}>
              <Input placeholder="INV-001" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="Invoice Date" name="invoiceDate" rules={assetFormRules.invoiceDate}>
              <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
            </Form.Item>
          </Col>
          <Col span={12} />
        </Row>

        {/* ── Section 3: Location ── */}
        <Divider orientation="left" orientationMargin={0} style={{ margin: '4px 0 12px', fontSize: 13, color: '#1890ff' }}>
          <EnvironmentOutlined style={{ marginRight: 6 }} />Location
        </Divider>

        <Row gutter={12}>
          <Col span={8}>
            <Form.Item label="Country" name="country">
              <Select
                placeholder="Country"
                showSearch
                optionFilterProp="label"
                onChange={() => { form.setFieldsValue({ state: undefined, city: undefined }); }}
                options={[
                  { label: 'India', value: 'India' },
                  { label: 'United States', value: 'United States' },
                  { label: 'United Kingdom', value: 'United Kingdom' },
                  { label: 'Singapore', value: 'Singapore' },
                  { label: 'UAE', value: 'United Arab Emirates' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="State" name="state">
              <Select
                placeholder="Select state"
                showSearch
                optionFilterProp="label"
                options={stateOptions}
                onChange={() => { form.setFieldsValue({ city: undefined }); }}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="City" name="city">
              <Select
                placeholder={watchState ? 'Select city' : 'Select state first'}
                showSearch
                optionFilterProp="label"
                options={cityOptions}
                disabled={!watchState}
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
}
