'use client';

import { useState } from 'react';
import { Drawer, Form, Input, InputNumber, Button, Space, Switch, message, Divider, Select } from 'antd';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { parseCookies } from 'nookies';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { categoryFormRules } from '../../utils/assetValidations';
import { CATEGORY_DATA_TYPES } from '../../utils/assetConstants';
import type { AssetCategory } from '../../types/domain.types';

interface AssetCategoryFormProps {
  open: boolean;
  onClose: () => void;
  editCategory?: AssetCategory | null;
}

export default function AssetCategoryForm({ open, onClose, editCategory }: AssetCategoryFormProps) {
  const { categories, setCategories } = useHrmAssetStore();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const isEdit = !!editCategory;

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSave = async () => {
    const { site, userId } = parseCookies();
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        site: site ?? '',
        categoryCode: values.categoryCode,
        categoryName: values.categoryName,
        description: values.description,
        wdvRatePct: values.wdvRatePct,
        usefulLifeYears: values.usefulLifeYears,
        salvageValueINR: values.salvageValueINR,
        attributeSchema: (values.attributeSchema ?? []).map(
          (f: { fieldName: string; label: string; dataType: string; required: boolean }) => ({
            fieldName: f.fieldName,
            label: f.label,
            dataType: f.dataType,
            required: f.required ?? false,
          })
        ),
        createdBy: userId ?? '',
      };

      const res = isEdit
        ? await HrmAssetService.updateCategory(payload)
        : await HrmAssetService.createCategory(payload);

      const updated: AssetCategory = {
        ...res,
        attributeSchema: res.attributeSchema ?? [],
        active: res.active ?? 1,
      };

      if (isEdit) {
        setCategories(categories.map((c) => (c.categoryCode === updated.categoryCode ? updated : c)));
        message.success('Category updated');
      } else {
        setCategories([...categories, updated]);
        message.success('Category created');
      }
      handleClose();
    } catch {
      message.error(`Failed to ${isEdit ? 'update' : 'create'} category`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit Category' : 'New Asset Category'}
      width={540}
      destroyOnHidden
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </Space>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={editCategory ?? { wdvRatePct: 15, attributeSchema: [] }}
      >
        <Form.Item label="Category Code" name="categoryCode" rules={categoryFormRules.categoryCode}>
          <Input disabled={isEdit} placeholder="e.g. LAPTOP" style={{ textTransform: 'uppercase' }} />
        </Form.Item>
        <Form.Item label="Category Name" name="categoryName" rules={categoryFormRules.categoryName}>
          <Input placeholder="e.g. Laptop / Notebook" />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item label="WDV Depreciation Rate (%)" name="wdvRatePct" rules={categoryFormRules.wdvRatePct}>
          <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.5} />
        </Form.Item>
        <Form.Item label="Useful Life (Years)" name="usefulLifeYears">
          <InputNumber style={{ width: '100%' }} min={1} />
        </Form.Item>
        <Form.Item label="Salvage Value (INR)" name="salvageValueINR">
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>

        <Divider>Attribute Schema</Divider>

        <Form.List name="attributeSchema">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <Form.Item
                    name={[name, 'fieldName']}
                    rules={[{ required: true, message: 'Required' }]}
                    style={{ flex: 1, margin: 0 }}
                  >
                    <Input placeholder="fieldName" />
                  </Form.Item>
                  <Form.Item
                    name={[name, 'label']}
                    rules={[{ required: true, message: 'Required' }]}
                    style={{ flex: 1, margin: 0 }}
                  >
                    <Input placeholder="Label" />
                  </Form.Item>
                  <Form.Item name={[name, 'dataType']} initialValue="TEXT" style={{ width: 90, margin: 0 }}>
                    <Select options={CATEGORY_DATA_TYPES} />
                  </Form.Item>
                  <Form.Item name={[name, 'required']} valuePropName="checked" style={{ margin: 0 }}>
                    <Switch size="small" checkedChildren="Req" unCheckedChildren="Opt" />
                  </Form.Item>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteIcon style={{ fontSize: 16 }} />}
                    onClick={() => remove(name)}
                  />
                </div>
              ))}
              <Button
                type="dashed"
                size="small"
                block
                icon={<AddIcon style={{ fontSize: 16 }} />}
                onClick={() => add({ dataType: 'TEXT', required: false })}
              >
                Add Field
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Drawer>
  );
}
