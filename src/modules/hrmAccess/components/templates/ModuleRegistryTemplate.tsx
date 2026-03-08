'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { HrmAccessService } from '../../services/hrmAccessService';
import { useHrmAccessStore } from '../../stores/hrmAccessStore';
import RbacStatusBadge from '../atoms/RbacStatusBadge';

interface Props {
  site: string;
  user: { id: string; name: string } | null;
}

const MODULE_CATEGORIES = [
  { label: 'All Categories', value: '' },
  { label: 'Core', value: 'CORE' },
  { label: 'HRM', value: 'HRM' },
  { label: 'Operations', value: 'OPERATIONS' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Reports', value: 'REPORTS' },
];

const ModuleRegistryTemplate: React.FC<Props> = ({ site, user }) => {
  const { permission, setAllModules } = useHrmAccessStore();
  const modules = permission.allModules;
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHandle, setEditingHandle] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const refreshModules = async () => {
    if (!site) return;
    setLoading(true);
    try {
      const data = categoryFilter
        ? await HrmAccessService.fetchModulesByCategory(site, categoryFilter)
        : await HrmAccessService.fetchAllModules(site);
      setAllModules(data);
    } catch {
      message.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (site && modules.length === 0) refreshModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site]);

  useEffect(() => {
    if (site) refreshModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter]);

  const filteredModules = useMemo(() => {
    if (!searchText.trim()) return modules;
    const q = searchText.toLowerCase();
    return modules.filter(
      (m) =>
        m.moduleCode.toLowerCase().includes(q) ||
        m.moduleName.toLowerCase().includes(q)
    );
  }, [modules, searchText]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingHandle) {
        await HrmAccessService.updateModule(editingHandle, { ...values, site });
        message.success('Module updated');
      } else {
        await HrmAccessService.createModule({ ...values, site, createdBy: user?.id ?? '' });
        message.success('Module created');
      }
      setModalOpen(false);
      form.resetFields();
      setEditingHandle(null);
      refreshModules();
    } catch {
      // validation or API error
    }
  };

  const handleDeactivate = async (handle: string) => {
    try {
      await HrmAccessService.deactivateModule(site, handle, user?.id ?? '');
      message.success('Module deactivated');
      refreshModules();
    } catch {
      message.error('Failed to deactivate module');
    }
  };

  const handleCreatePermissions = async (moduleCode: string) => {
    const objectNames = form.getFieldValue('defaultPermissionObjects');
    if (!objectNames) {
      message.info('Enter default permission objects first');
      return;
    }
    try {
      const names = objectNames.split(',').map((n: string) => n.trim()).filter(Boolean);
      await HrmAccessService.createPermissionsForModule(site, moduleCode, names, user?.id ?? '');
      message.success('Permissions created for module');
    } catch {
      message.error('Failed to create permissions');
    }
  };

  const columns: ColumnsType<(typeof modules)[0]> = [
    {
      title: 'Module Code',
      dataIndex: 'moduleCode',
      width: 160,
      sorter: (a, b) => a.moduleCode.localeCompare(b.moduleCode),
    },
    {
      title: 'Module Name',
      dataIndex: 'moduleName',
      sorter: (a, b) => a.moduleName.localeCompare(b.moduleName),
    },
    {
      title: 'Category',
      dataIndex: 'moduleCategory',
      width: 140,
      render: (cat: string) => <Tag>{cat || 'N/A'}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      width: 100,
      render: (_: unknown, record) => <RbacStatusBadge isActive={record.isActive} />,
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Actions',
      width: 150,
      render: (_, record) => (
        <>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingHandle(record.handle);
              form.setFieldsValue({
                moduleCode: record.moduleCode,
                moduleName: record.moduleName,
                category: record.moduleCategory,
                description: '',
              });
              setModalOpen(true);
            }}
            style={{ marginRight: 8 }}
          />
          <Popconfirm title="Deactivate this module?" onConfirm={() => handleDeactivate(record.handle)}>
            <Button size="small" icon={<StopOutlined />} danger />
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Module Registry</span>
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 180 }}
            options={MODULE_CATEGORIES}
            placeholder="Filter by category"
          />
          <Input
            placeholder="Search modules..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingHandle(null);
            form.resetFields();
            setModalOpen(true);
          }}
        >
          Register Module
        </Button>
      </div>
      <Table
        dataSource={filteredModules}
        columns={columns}
        rowKey="handle"
        loading={loading}
        size="small"
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `${t} modules` }}
      />
      <Modal
        title={editingHandle ? 'Edit Module' : 'Register New Module'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => {
          setModalOpen(false);
          setEditingHandle(null);
          form.resetFields();
        }}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="moduleCode" label="Module Code" rules={[{ required: true }]}>
            <Input disabled={!!editingHandle} placeholder="e.g., MOD-EMP" />
          </Form.Item>
          <Form.Item name="moduleName" label="Module Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., Employee Master" />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select
              placeholder="Select category"
              options={MODULE_CATEGORIES.filter((c) => c.value !== '')}
            />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Module description" />
          </Form.Item>
          <Form.Item name="defaultPermissionObjects" label="Default Permission Objects (comma-separated)">
            <Input placeholder="e.g., Company, BusinessUnit, Department" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ModuleRegistryTemplate;
