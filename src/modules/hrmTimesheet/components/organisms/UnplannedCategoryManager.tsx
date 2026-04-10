'use client';
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Space, Table, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { message } from 'antd';
import { parseCookies } from 'nookies';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import { HrmTimesheetService } from '../../services/hrmTimesheetService';
import Can from '../../../hrmAccess/components/Can';
import type { UnplannedCategory } from '../../types/domain.types';
import styles from '../../styles/HrmTimesheet.module.css';

const { Title } = Typography;

interface CategoryFormValues {
  label: string;
  description?: string;
  displayOrder: number;
}

export default function UnplannedCategoryManager() {
  const { unplannedCategories, setUnplannedCategories } = useHrmTimesheetStore();
  const cookies = parseCookies();
  const site = cookies.site ?? '';
  const employeeId =
    cookies.employeeId ??
    cookies.employeeCode ??
    cookies.username ??
    cookies.userId ??
    cookies.user ??
    cookies.rl_user_id ??
    '';
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UnplannedCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<CategoryFormValues>();

  async function reloadCategories() {
    const data = await HrmTimesheetService.getUnplannedCategories(site);
    setUnplannedCategories(
      data.map((c) => ({
        handle: c.handle,
        site: c.site,
        label: c.label,
        description: c.description,
        displayOrder: c.displayOrder,
        active: c.active,
      }))
    );
  }

  function openCreate() {
    setEditTarget(null);
    form.resetFields();
    form.setFieldValue('displayOrder', unplannedCategories.length + 1);
    setModalOpen(true);
  }

  function openEdit(cat: UnplannedCategory) {
    setEditTarget(cat);
    form.setFieldsValue({ label: cat.label, description: cat.description, displayOrder: cat.displayOrder });
    setModalOpen(true);
  }

  async function handleSave(values: CategoryFormValues) {
    setSaving(true);
    try {
      if (editTarget) {
        await HrmTimesheetService.updateUnplannedCategory(
          site,
          editTarget.handle,
          values.label,
          values.description ?? '',
          values.displayOrder,
          employeeId
        );
        message.success('Category updated');
      } else {
        await HrmTimesheetService.createUnplannedCategory(
          site,
          values.label,
          values.description ?? '',
          values.displayOrder,
          employeeId
        );
        message.success('Category created');
      }
      setModalOpen(false);
      await reloadCategories();
    } catch (err) {
      message.error('Failed to save category');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(handle: string) {
    try {
      await HrmTimesheetService.deleteUnplannedCategory(site, handle, employeeId);
      message.success('Category deleted');
      await reloadCategories();
    } catch (err) {
      message.error('Failed to delete category');
    }
  }

  const columns = [
    { title: 'Label', dataIndex: 'label', key: 'label' },
    { title: 'Description', dataIndex: 'description', key: 'description', render: (v: string) => v ?? '—' },
    { title: 'Order', dataIndex: 'displayOrder', key: 'displayOrder', width: 80, align: 'center' as const },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, cat: UnplannedCategory) => (
        <Space>
          <Can I="edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(cat)} />
          </Can>
          <Can I="delete">
            <Popconfirm title="Delete this category?" onConfirm={() => handleDelete(cat.handle)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Can>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.categoryManager}>
      <div className={styles.categoryManagerHeader}>
        <Title level={5} style={{ margin: 0 }}>Unplanned Work Categories</Title>
        <Can I="add">
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>
            Add Category
          </Button>
        </Can>
      </div>

      <Table
        size="small"
        dataSource={unplannedCategories}
        rowKey="handle"
        columns={columns}
        pagination={false}
      />

      <Modal
        open={modalOpen}
        title={editTarget ? 'Edit Category' : 'New Category'}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="label" label="Label" rules={[{ required: true, message: 'Required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input />
          </Form.Item>
          <Form.Item name="displayOrder" label="Display Order" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
