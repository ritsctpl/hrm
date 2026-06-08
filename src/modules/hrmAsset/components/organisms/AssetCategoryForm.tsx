'use client';

import { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Switch,
  message,
  Divider,
  Select,
  Row,
  Col,
  Table,
  Tag,
  Tooltip,
  Popconfirm,
  Typography,
} from 'antd';
import type { ColumnsType, ColumnType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { categoryFormRules } from '../../utils/assetValidations';
import { CATEGORY_DATA_TYPES } from '../../utils/assetConstants';
import type { AssetCategory } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';

interface AssetCategoryFormProps {
  open: boolean;
  onClose: () => void;
  editCategory?: AssetCategory | null;
  onEditCategory?: (cat: AssetCategory | null) => void;
}

const NEW_DEFAULTS = { wdvRatePct: 15, attributeSchema: [] as AssetCategory['attributeSchema'] };

export default function AssetCategoryForm({ open, onClose, editCategory, onEditCategory }: AssetCategoryFormProps) {
  const { categories, setCategories } = useHrmAssetStore();
  const [saving, setSaving] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [form] = Form.useForm();
  const isEdit = !!editCategory;

  // Keep the form in sync with what the drawer is opened for. Without this the
  // form holds onto values from the previous edit, so clicking "Categories"
  // (create mode) would still show the last-edited category's data.
  useEffect(() => {
    if (!open) return;
    if (editCategory) {
      form.setFieldsValue({
        ...editCategory,
        attributeSchema: editCategory.attributeSchema ?? [],
      });
    } else {
      form.resetFields();
      form.setFieldsValue(NEW_DEFAULTS);
    }
  }, [open, editCategory, form]);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSave = async () => {
    const organizationId = getOrganizationId();
    const { userId } = parseCookies();
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        organizationId,
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

  const handleDelete = async (cat: AssetCategory) => {
    const organizationId = getOrganizationId();
    const { userId } = parseCookies();
    setDeletingCode(cat.categoryCode);
    try {
      await HrmAssetService.deleteCategory(organizationId, cat.categoryCode, userId ?? '');
      setCategories(categories.filter((c) => c.categoryCode !== cat.categoryCode));
      message.success('Category deleted');
    } catch {
      message.error('Failed to delete category');
    } finally {
      setDeletingCode(null);
    }
  };

  // Per-column search filter — gives every column its own smart filter dropdown.
  const getColumnSearchProps = (
    label: string,
    getValue: (c: AssetCategory) => string,
  ): ColumnType<AssetCategory> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          autoFocus
          placeholder={`Search ${label}`}
          value={selectedKeys[0] as string}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          size="small"
          style={{ marginBottom: 8, display: 'block', width: 170 }}
        />
        <Space>
          <Button type="primary" size="small" onClick={() => confirm()}>Search</Button>
          <Button size="small" onClick={() => { clearFilters?.(); confirm(); }}>Reset</Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />,
    onFilter: (value, record) =>
      getValue(record).toLowerCase().includes(String(value).toLowerCase()),
  });

  const columns: ColumnsType<AssetCategory> = [
    {
      title: 'Name',
      dataIndex: 'categoryName',
      ellipsis: true,
      sorter: (a, b) => (a.categoryName ?? '').localeCompare(b.categoryName ?? ''),
      ...getColumnSearchProps('name', (c) => c.categoryName ?? ''),
    },
    {
      title: 'Code',
      dataIndex: 'categoryCode',
      // width: 120,
      sorter: (a, b) => (a.categoryCode ?? '').localeCompare(b.categoryCode ?? ''),
      render: (code: string) => <Tag style={{ margin: 0 }}>{code}</Tag>,
      ...getColumnSearchProps('code', (c) => c.categoryCode ?? ''),
    },
    {
      title: 'WDV %',
      dataIndex: 'wdvRatePct',
      // width: 90,
      align: 'right',
      sorter: (a, b) => (a.wdvRatePct ?? 0) - (b.wdvRatePct ?? 0),
      render: (v: number) => `${v ?? 0}%`,
      ...getColumnSearchProps('WDV %', (c) => String(c.wdvRatePct ?? '')),
    },
    // {
    //   title: 'Life (Yrs)',
    //   dataIndex: 'usefulLifeYears',
    //   width: 95,
    //   align: 'right',
    //   sorter: (a, b) => (a.usefulLifeYears ?? 0) - (b.usefulLifeYears ?? 0),
    //   render: (v: number) => v ?? '—',
    //   ...getColumnSearchProps('life', (c) => String(c.usefulLifeYears ?? '')),
    // },
    // {
    //   title: 'Salvage',
    //   dataIndex: 'salvageValueINR',
    //   width: 110,
    //   align: 'right',
    //   sorter: (a, b) => (a.salvageValueINR ?? 0) - (b.salvageValueINR ?? 0),
    //   render: (v: number) => (v != null ? v.toLocaleString('en-IN') : '—'),
    //   ...getColumnSearchProps('salvage', (c) => String(c.salvageValueINR ?? '')),
    // },
    {
      title: 'Attrs',
      dataIndex: 'attributeSchema',
      // width: 80,
      align: 'center',
      sorter: (a, b) => (a.attributeSchema?.length ?? 0) - (b.attributeSchema?.length ?? 0),
      render: (arr: AssetCategory['attributeSchema']) => arr?.length ?? 0,
      ...getColumnSearchProps('attribute count', (c) => String(c.attributeSchema?.length ?? 0)),
    },
    {
      title: 'Actions',
      key: 'actions',
      // width: 84,
      fixed: 'right',
      render: (_: unknown, cat: AssetCategory) => (
        <Space size={0} onClick={(e) => e.stopPropagation()}>
          <Can I="edit" object="asset_category">
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditIcon style={{ fontSize: 16 }} />}
                onClick={() => onEditCategory?.(cat)}
              />
            </Tooltip>
          </Can>
          <Can I="delete" object="asset_category">
            <Popconfirm
              title="Delete category"
              description={`Delete "${cat.categoryName}"? This cannot be undone.`}
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(cat)}
            >
              <Tooltip title="Delete">
                <Button
                  type="text"
                  size="small"
                  danger
                  loading={deletingCode === cat.categoryCode}
                  icon={<DeleteIcon style={{ fontSize: 16 }} />}
                />
              </Tooltip>
            </Popconfirm>
          </Can>
        </Space>
      ),
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit Category' : 'New Asset Category'}
      width={760}
      destroyOnHidden
      styles={{ body: { paddingTop: 16 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Can I={isEdit ? 'edit' : 'add'} object="asset_category">
              <Button type="primary" loading={saving} onClick={handleSave}>
                {isEdit ? 'Update Category' : 'Create Category'}
              </Button>
            </Can>
          </Space>
        </div>
      }
    >
      {/* Existing categories — always visible so you can switch while editing */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Divider orientation="left" style={{ marginTop: 0, marginBottom: 8, fontSize: 13 }}>
            Existing Categories
          </Divider>
          {isEdit && (
            <Button
              type="link"
              size="small"
              icon={<AddIcon style={{ fontSize: 16 }} />}
              onClick={() => onEditCategory?.(null)}
            >
              New
            </Button>
          )}
        </div>
        <Table<AssetCategory>
          rowKey="categoryCode"
          size="small"
          columns={columns}
          dataSource={categories}
          pagination={false}
          scroll={{ x: 660, y: 240 }}
          locale={{ emptyText: 'No categories yet' }}
          onRow={(cat) => ({
            onClick: () => onEditCategory?.(cat),
            style: {
              cursor: 'pointer',
              background: editCategory?.categoryCode === cat.categoryCode ? '#e6f4ff' : undefined,
            },
          })}
        />
        <Divider orientation="left" style={{ fontSize: 13 }}>
          {isEdit ? `Edit: ${editCategory?.categoryName ?? ''}` : 'New Category'}
        </Divider>
      </div>

      <Form form={form} layout="vertical" initialValues={editCategory ?? NEW_DEFAULTS}>
        <Divider orientation="left" style={{ marginTop: 0, fontSize: 13 }}>Basic Details</Divider>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="Category Code" name="categoryCode" rules={categoryFormRules.categoryCode}>
              <Input disabled={isEdit} placeholder="e.g. LAPTOP" style={{ textTransform: 'uppercase' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Category Name" name="categoryName" rules={categoryFormRules.categoryName}>
              <Input placeholder="e.g. Laptop / Notebook" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Description" name="description">
          <Input.TextArea rows={2} placeholder="Short description of this category" />
        </Form.Item>

        <Divider orientation="left" style={{ fontSize: 13 }}>Depreciation</Divider>
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item label="WDV Rate (%)" name="wdvRatePct" rules={categoryFormRules.wdvRatePct}>
              <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.5} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Useful Life (Yrs)" name="usefulLifeYears">
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Salvage (INR)" name="salvageValueINR">
              <InputNumber<number>
                style={{ width: '100%' }}
                min={0}
                step={1000}
                formatter={(v) => (v == null ? '' : `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','))}
                parser={(v) => Number((v ?? '').replace(/,/g, ''))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ fontSize: 13 }}>
          Custom Attributes
          <Typography.Text type="secondary" style={{ fontSize: 11, fontWeight: 400, marginLeft: 8 }}>
            fields captured per asset in this category
          </Typography.Text>
        </Divider>

        <Form.List name="attributeSchema">
          {(fields, { add, remove }) => (
            <>
              {fields.length === 0 ? (
                <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                  No custom attributes. Add fields like RAM, Serial No., Screen Size…
                </Typography.Text>
              ) : (
                <Row gutter={8} style={{ marginBottom: 4, padding: '0 4px' }}>
                  <Col span={7}><Typography.Text type="secondary" style={{ fontSize: 11 }}>Field Name</Typography.Text></Col>
                  <Col span={7}><Typography.Text type="secondary" style={{ fontSize: 11 }}>Label</Typography.Text></Col>
                  <Col span={5}><Typography.Text type="secondary" style={{ fontSize: 11 }}>Type</Typography.Text></Col>
                  <Col span={3}><Typography.Text type="secondary" style={{ fontSize: 11 }}>Req</Typography.Text></Col>
                  <Col span={2} />
                </Row>
              )}
              {fields.map(({ key, name }) => (
                <Row
                  key={key}
                  gutter={8}
                  align="middle"
                  wrap={false}
                  style={{
                    marginBottom: 8,
                    padding: '6px 4px',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    background: '#fafafa',
                  }}
                >
                  <Col span={7}>
                    <Form.Item
                      name={[name, 'fieldName']}
                      rules={[{ required: true, message: '' }]}
                      style={{ margin: 0 }}
                    >
                      <Input placeholder="field_name" size="small" />
                    </Form.Item>
                  </Col>
                  <Col span={7}>
                    <Form.Item
                      name={[name, 'label']}
                      rules={[{ required: true, message: '' }]}
                      style={{ margin: 0 }}
                    >
                      <Input placeholder="Display label" size="small" />
                    </Form.Item>
                  </Col>
                  <Col span={5}>
                    <Form.Item name={[name, 'dataType']} initialValue="TEXT" style={{ margin: 0 }}>
                      <Select size="small" style={{ width: '100%' }} options={CATEGORY_DATA_TYPES} />
                    </Form.Item>
                  </Col>
                  <Col span={3}>
                    <Form.Item name={[name, 'required']} valuePropName="checked" initialValue={false} style={{ margin: 0 }}>
                      <Switch size="small" checkedChildren="Req" unCheckedChildren="Opt" />
                    </Form.Item>
                  </Col>
                  <Col span={2} style={{ textAlign: 'right' }}>
                    <Tooltip title="Remove field">
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteIcon style={{ fontSize: 16 }} />}
                        onClick={() => remove(name)}
                      />
                    </Tooltip>
                  </Col>
                </Row>
              ))}
              <Button
                type="dashed"
                size="small"
                block
                style={{ marginTop: 4 }}
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
