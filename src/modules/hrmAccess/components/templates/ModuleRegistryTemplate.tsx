'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Tag, Checkbox } from 'antd';
import { EditOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { HrmAccessService } from '../../services/hrmAccessService';
import { useHrmAccessStore } from '../../stores/hrmAccessStore';
import RbacStatusBadge from '../atoms/RbacStatusBadge';
import { MdDelete } from 'react-icons/md';
import { fetchTop50Activity } from '@/services/activityService';

interface Props {
  site: string;
  user: { id: string; name: string } | null;
}

interface Activity {
  activityId: string;
  description: string;
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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [form] = Form.useForm();
  const hasLoadedRef = useRef(false);

  // Load modules only once on mount
  useEffect(() => {
    if (!site || hasLoadedRef.current) return;
    
    hasLoadedRef.current = true;
    const loadModules = async () => {
      setLoading(true);
      try {
        const data = await HrmAccessService.fetchAllModules(site);
        setAllModules(data);
      } catch {
        message.error('Failed to load modules');
      } finally {
        setLoading(false);
      }
    };

    loadModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site]);

  // Load activities from activity service
  useEffect(() => {
    if (!site) return;
    
    const loadActivities = async () => {
      setLoadingActivities(true);
      try {
        const activityList = await fetchTop50Activity(site);
        setActivities(activityList || []);
      } catch (error) {
        console.error('Failed to load activities:', error);
        message.error('Failed to load activity list');
      } finally {
        setLoadingActivities(false);
      }
    };

    loadActivities();
  }, [site]);

  // Refresh modules when category filter changes
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

  const filteredModules = useMemo(() => {
    if (!searchText.trim()) return modules;
    const q = searchText.toLowerCase();
    return modules.filter(
      (m) =>
        m.moduleCode.toLowerCase().includes(q) ||
        m.moduleName.toLowerCase().includes(q)
    );
  }, [modules, searchText]);

  // Create activity options for dropdown - show description, store activityId
  const activityOptions = useMemo(() => {
    return activities.map((activity) => ({
      label: activity.description,        // Display: "Employee Master"
      value: activity.description,        // Store: "Employee Master"
      activityId: activity.activityId,    // Hidden: "HRM_EMPLOYEE"
    }));
  }, [activities]);

  // Handle module name selection - auto-set module code in background
  const handleModuleNameSelect = (moduleName: string) => {
    const selectedActivity = activities.find((a) => a.description === moduleName);
    if (selectedActivity) {
      // Set both moduleName (visible) and moduleCode (hidden)
      form.setFieldsValue({
        moduleName: selectedActivity.description,
        moduleCode: selectedActivity.activityId,
      });
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingHandle) {
        // Update the module
        await HrmAccessService.updateModule(editingHandle, { ...values, site });
        
        // If there are default permission objects, create permissions for them
        // (This will create permissions for any new objects added)
        if (values.defaultPermissionObjects && values.defaultPermissionObjects.length > 0) {
          try {
            await HrmAccessService.createPermissionsForModule(
              site,
              values.moduleCode,
              values.defaultPermissionObjects,
              user?.id ?? 'system'
            );
            message.success('Module updated and permissions synchronized');
          } catch (permError) {
            console.error('Failed to create/update permissions:', permError);
            message.warning('Module updated but some permissions may have failed');
          }
        } else {
          message.success('Module updated');
        }
      } else {
        const payload = {
          site,
          moduleCode: values.moduleCode,
          moduleName: values.moduleName,
          moduleCategory: values.moduleCategory,
          description: values.description || '',
          defaultPermissionObjects: values.defaultPermissionObjects || [],
          isActive: values.isActive !== false,
          createdBy: user?.id ?? 'system',
        };
        
        // Create the module
        await HrmAccessService.createModule(payload);
        
        // If there are default permission objects, create permissions for them
        if (values.defaultPermissionObjects && values.defaultPermissionObjects.length > 0) {
          try {
            await HrmAccessService.createPermissionsForModule(
              site,
              values.moduleCode,
              values.defaultPermissionObjects,
              user?.id ?? 'system'
            );
            message.success('Module and permissions created successfully');
          } catch (permError) {
            console.error('Failed to create permissions:', permError);
            message.warning('Module created but some permissions may have failed');
          }
        } else {
          message.success('Module created');
        }
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
      await HrmAccessService.deactivateModule(site, handle, user?.id ?? 'system');
      message.success('Module deactivated');
      refreshModules();
    } catch {
      message.error('Failed to deactivate module');
    }
  };

  const columns: ColumnsType<(typeof modules)[0]> = [
    {
      title: 'Module Code',
      dataIndex: 'moduleCode',
      sorter: (a, b) => a.moduleCode.localeCompare(b.moduleCode),
      width: '15%',
    },
    {
      title: 'Module Name',
      dataIndex: 'moduleName',
      sorter: (a, b) => a.moduleName.localeCompare(b.moduleName),
      width: '30%',
    },
    {
      title: 'Category',
      dataIndex: 'moduleCategory',
      render: (cat: string) => <Tag>{cat || 'N/A'}</Tag>,
      width: '15%',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      render: (_: unknown, record) => <RbacStatusBadge isActive={record.isActive} />,
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      width: '12%',
    },
    {
      title: 'Actions',
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
                moduleCategory: record.moduleCategory,
                description: record.description || '',
                defaultPermissionObjects: record.defaultPermissionObjects || [],
                isActive: record.isActive,
              });
              setModalOpen(true);
            }}
            style={{ marginRight: 8 }}
          />
          <Popconfirm title="Deactivate this module?" onConfirm={() => handleDeactivate(record.handle)}>
            <Button size="small" icon={<MdDelete />} danger />
          </Popconfirm>
        </>
      ),
      width: '12%',
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
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="default"
            onClick={refreshModules}
            loading={loading}
          >
            Go
          </Button>
          <Button
            type="primary"
            onClick={() => {
              setEditingHandle(null);
              form.resetFields();
              setModalOpen(true);
            }}
          >
            +
          </Button>
        </div>
      </div>
      <Table
        dataSource={filteredModules}
        columns={columns}
        rowKey="handle"
        loading={loading}
        size="small"
        scroll={{ x: 1000, y: 'calc(100vh - 280px)' }}
        pagination={false}
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
          <Form.Item name="moduleCode" label="Module Code" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="moduleName" label="Module Name" rules={[{ required: true }]}>
            {!editingHandle ? (
              <Select
                showSearch
                placeholder="Select module name"
                options={activityOptions}
                onChange={handleModuleNameSelect}
                loading={loadingActivities}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                allowClear
              />
            ) : (
              <Input placeholder="e.g., Attendance Management" />
            )}
          </Form.Item>
          <Form.Item name="moduleCategory" label="Category" rules={[{ required: true }]}>
            <Select
              placeholder="Select category"
              options={MODULE_CATEGORIES.filter((c) => c.value !== '')}
            />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Manages employee attendance and shifts" />
          </Form.Item>
          <Form.Item name="defaultPermissionObjects" label="Default Permission Objects">
            <Select
              mode="tags"
              placeholder="e.g., Attendance, Shift, Overtime"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked" initialValue={true}>
            <Checkbox />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ModuleRegistryTemplate;
