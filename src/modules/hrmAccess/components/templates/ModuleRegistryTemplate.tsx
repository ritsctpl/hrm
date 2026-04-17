'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Tag, Checkbox } from 'antd';
import { EditOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { HrmAccessService } from '../../services/hrmAccessService';
import { useHrmAccessStore } from '../../stores/hrmAccessStore';
import { getObjectsForModule, getObjectsByAppUrl, getModuleCodeByAppUrl } from '../../utils/moduleObjectRegistry';
import { useHrmRbacStore } from '../../stores/hrmRbacStore';
import RbacStatusBadge from '../atoms/RbacStatusBadge';
import { MdDelete } from 'react-icons/md';

interface Props {
  organizationId: string;
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

const MODULE_TYPES = [
  { label: 'CORE', value: 'CORE' },
  { label: 'CUSTOM', value: 'CUSTOM' },
  { label: 'INTEGRATION', value: 'INTEGRATION' },
  { label: 'PLUGIN', value: 'PLUGIN' },
];

const ModuleRegistryTemplate: React.FC<Props> = ({ organizationId, user }) => {
  const { permission, setAllModules } = useHrmAccessStore();
  const modules = permission.allModules;
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHandle, setEditingHandle] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const hasLoadedRef = useRef(false);

  // Load modules only once on mount
  useEffect(() => {
    if (!organizationId || hasLoadedRef.current) return;
    
    hasLoadedRef.current = true;
    const loadModules = async () => {
      setLoading(true);
      try {
        const data = await HrmAccessService.fetchAllModules(organizationId);
        setAllModules(data);
      } catch {
        message.error('Failed to load modules');
      } finally {
        setLoading(false);
      }
    };

    loadModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  // Refresh modules - always fetch all and filter client-side
  const refreshModules = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const data = await HrmAccessService.fetchAllModules(organizationId);
      setAllModules(data);
    } catch {
      message.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = useMemo(() => {
    let result = modules;
    
    // Filter by category
    if (categoryFilter) {
      result = result.filter((m) => m.moduleCategory === categoryFilter);
    }
    
    // Filter by search text
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (m) =>
          m.moduleCode.toLowerCase().includes(q) ||
          m.moduleName.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [modules, categoryFilter, searchText]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingHandle) {
        // Update the module
        await HrmAccessService.updateModule(editingHandle, { ...values, organizationId });
        
        // Handle permission objects synchronization
        if (values.defaultPermissionObjects && values.defaultPermissionObjects.length > 0) {
          try {
            // Get existing permissions for this module
            const existingPermissions = await HrmAccessService.fetchPermissionsByModule(values.moduleCode);
            const existingObjects = existingPermissions.map(p => p.objectName);
            const newObjects = values.defaultPermissionObjects;
            
            // Find objects to delete (in existing but not in new)
            const objectsToDelete = existingObjects.filter(obj => !newObjects.includes(obj));
            
            // Find objects to create (in new but not in existing)
            const objectsToCreate = newObjects.filter(obj => !existingObjects.includes(obj));
            
            // Delete removed objects
            if (objectsToDelete.length > 0) {
              const permissionsToDelete = existingPermissions.filter(p => 
                objectsToDelete.includes(p.objectName)
              );
              await Promise.all(
                permissionsToDelete.map(perm =>
                  HrmAccessService.deletePermission(organizationId, perm.handle, user?.id ?? 'system')
                )
              );
            }
            
            // Create new objects
            if (objectsToCreate.length > 0) {
              await HrmAccessService.createPermissionsForModule(
                organizationId,
                values.moduleCode,
                objectsToCreate,
                user?.id ?? 'system'
              );
            }
            
            message.success('Module updated and permissions synchronized');
          } catch (permError) {
            console.error('Failed to sync permissions:', permError);
            message.warning('Module updated but some permissions may have failed');
          }
        } else {
          // If no default objects, delete all existing permissions for this module
          try {
            const existingPermissions = await HrmAccessService.fetchPermissionsByModule(values.moduleCode);
            if (existingPermissions.length > 0) {
              await Promise.all(
                existingPermissions.map(perm =>
                  HrmAccessService.deletePermission(organizationId, perm.handle, user?.id ?? 'system')
                )
              );
            }
            message.success('Module updated and permissions cleared');
          } catch (permError) {
            console.error('Failed to clear permissions:', permError);
            message.warning('Module updated but failed to clear permissions');
          }
        }
      } else {
        const payload = {
          organizationId,
          moduleCode: values.moduleCode,
          moduleName: values.moduleName,
          moduleCategory: values.moduleCategory,
          description: values.description || '',
          defaultPermissionObjects: values.defaultPermissionObjects || [],
          appUrl: values.appUrl || '',
          type: values.type || 'CORE',
          isActive: values.isActive !== false,
          createdBy: user?.id ?? 'system',
        };
        
        // Create the module
        await HrmAccessService.createModule(payload);
        
        // If there are default permission objects, create permissions for them
        if (values.defaultPermissionObjects && values.defaultPermissionObjects.length > 0) {
          try {
            await HrmAccessService.createPermissionsForModule(
              organizationId,
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

  const handleDeactivate = async (handle: string, moduleCode: string) => {
    try {
      // First, get all permissions for this module
      const permissions = await HrmAccessService.fetchPermissionsByModule(moduleCode);
      
      // Delete all permissions for this module
      if (permissions && permissions.length > 0) {
        await Promise.all(
          permissions.map((perm) =>
            HrmAccessService.deletePermission(organizationId, perm.handle, user?.id ?? 'system')
          )
        );
      }
      
      // Then deactivate the module
      await HrmAccessService.deactivateModule(organizationId, handle, user?.id ?? 'system');
      message.success('Module and all associated permissions deleted');
      refreshModules();
    } catch (error) {
      console.error('Failed to deactivate module:', error);
      message.error('Failed to deactivate module');
    }
  };

  const columns: ColumnsType<(typeof modules)[0]> = [
    {
      title: 'Module Code',
      dataIndex: 'moduleCode',
      sorter: (a, b) => a.moduleCode.localeCompare(b.moduleCode),
      width: '12%',
    },
    {
      title: 'Module Name',
      dataIndex: 'moduleName',
      sorter: (a, b) => a.moduleName.localeCompare(b.moduleName),
      width: '20%',
    },
    {
      title: 'Category',
      dataIndex: 'moduleCategory',
      render: (cat: string) => <Tag>{cat || 'N/A'}</Tag>,
      width: '10%',
    },
    {
      title: 'App URL',
      dataIndex: 'appUrl',
      key: 'appUrl',
      render: (appUrl: string) => appUrl || '-',
      width: '18%',
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      render: (type: string) => <Tag color="blue">{type || 'CORE'}</Tag>,
      width: '10%',
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
      width: '10%',
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
                appUrl: (record as any).appUrl || '',
                type: (record as any).type || 'CORE',
                isActive: record.isActive,
              });
              setModalOpen(true);
            }}
            style={{ marginRight: 8 }}
          />
          <Popconfirm 
            title="Delete this module and all its permissions?" 
            description="This will permanently delete all permissions associated with this module."
            onConfirm={() => handleDeactivate(record.handle, record.moduleCode)}
          >
            <Button size="small" icon={<MdDelete />} danger />
          </Popconfirm>
        </>
      ),
      width: '10%',
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
        width={600}
        style={{ top: 20 }}
        bodyStyle={{
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="moduleCode"
            label="Module Code"
            rules={[{ required: true, message: 'Module Code is required' }]}
          >
            <Input
              placeholder="e.g. HRM_EMPLOYEE"
              disabled={!!editingHandle}
              maxLength={50}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z_]/g, '');
                form.setFieldsValue({ moduleCode: value });
              }}
            />
          </Form.Item>
          <Form.Item name="moduleName" label="Module Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., Attendance Management" />
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
          <Form.Item 
            name="appUrl" 
            label="App URL" 
            rules={[
              {
                pattern: /^(\/[\w\-\/]*|\w+:\/\/.+)$/,
                message: 'Please enter a valid path (e.g., /hrm/employee) or full URL',
              },
            ]}
          >
            <Input placeholder="e.g., /hrm/employee or https://example.com/module" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]} initialValue="CORE">
            <Select
              placeholder="Select module type"
              options={MODULE_TYPES}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.moduleCode !== cur.moduleCode || prev.appUrl !== cur.appUrl}>
            {() => {
              const moduleCode = form.getFieldValue('moduleCode') ?? '';
              const appUrl = form.getFieldValue('appUrl') ?? '';

              // 1. Try hardcoded registry by moduleCode
              let known = getObjectsForModule(moduleCode);
              let matchSource = moduleCode;

              // 2. Fallback: try hardcoded registry by appUrl
              if (known.length === 0 && appUrl) {
                known = getObjectsByAppUrl(appUrl);
                matchSource = appUrl;
              }

              // 3. Fallback: resolve moduleCode from appUrl via store
              //    (works for modules created at runtime, not in hardcoded map)
              if (known.length === 0 && appUrl) {
                const storeModules = useHrmRbacStore.getState().currentOrgModules ?? [];
                const storeMatch = storeModules.find(
                  (m) => m.appUrl === appUrl || m.moduleCode === moduleCode,
                );
                if (storeMatch) {
                  known = getObjectsForModule(storeMatch.moduleCode);
                  matchSource = storeMatch.moduleCode;
                }
              }

              return (
                <Form.Item
                  name="defaultPermissionObjects"
                  label="Permission Objects"
                  extra={
                    known.length > 0
                      ? `${known.length} predefined objects matched from ${matchSource}. You can also type custom ones.`
                      : 'Type object codes (e.g., flow_record, flow_settings) and press Enter.'
                  }
                >
                  <Select
                    mode="tags"
                    placeholder={known.length > 0 ? 'Select from predefined objects' : 'Type object codes and press Enter'}
                    style={{ width: '100%' }}
                    options={known.map((o) => ({ value: o.code, label: `${o.label} (${o.code})` }))}
                  />
                </Form.Item>
              );
            }}
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
