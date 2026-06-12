'use client';
import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, Switch, Space, Tag, Popconfirm,
  Select, Typography, Tooltip, Alert, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ImportOutlined, StarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { HrmProjectService } from '../../services/hrmProjectService';
import type { ProjectTask } from '../../types/domain.types';
import type { ProjectTaskResponse } from '../../types/api.types';
import type { TaskFormValues } from '../../types/ui.types';
import Can from '../../../hrmAccess/components/Can';

const { Text } = Typography;

export default function ProjectTasksTab() {
  const { selectedProject, projects } = useHrmProjectStore();
  const { createTask, updateTask, removeTask, importTasks } = useProjectMutations();
  const [form] = Form.useForm<TaskFormValues>();
  const [editing, setEditing] = useState<ProjectTask | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultsOpen, setDefaultsOpen] = useState(false);
  const [defaultTasks, setDefaultTasks] = useState<ProjectTaskResponse[]>([]);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importSource, setImportSource] = useState<string | undefined>();

  if (!selectedProject) return null;
  const tasks = selectedProject.tasks ?? [];
  // Matches BE D1 (PRJ_008): tasks are editable on INITIATED/DRAFT/IN_PROGRESS/ON_HOLD,
  // blocked only on terminal COMPLETED / CANCELLED projects.
  const blockedStatuses = new Set(['COMPLETED', 'CANCELLED']);
  const canEditTasks = !blockedStatuses.has(selectedProject.status);
  const blockedReason = `Tasks cannot be changed on ${selectedProject.status.replace('_', ' ')} projects`;

  // Reconciliation: total task estimated hours should match the project estimate
  const taskEstTotal = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
  const projectEst = selectedProject.estimateHours || 0;
  const estDiff = projectEst - taskEstTotal;

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ billable: false, isDefault: false });
    setModalOpen(true);
  };

  const openEdit = (t: ProjectTask) => {
    setEditing(t);
    form.setFieldsValue({
      taskName: t.taskName,
      description: t.description,
      estimatedHours: t.estimatedHours,
      billableRate: t.billableRate ?? undefined,
      billable: t.billable,
      isDefault: t.isDefault,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      // Hard rule: total task estimated hours must not exceed the project estimate
      const newEst = values.estimatedHours || 0;
      const othersEst = taskEstTotal - (editing ? (editing.estimatedHours || 0) : 0);
      if (projectEst > 0 && othersEst + newEst > projectEst) {
        message.error(`Task estimates would total ${othersEst + newEst} h, exceeding the project estimate of ${projectEst} h. Reduce hours or raise the project estimate.`);
        return;
      }
      if (editing) await updateTask(selectedProject.handle, editing.handle, values);
      else await createTask(selectedProject.handle, values);
      setModalOpen(false);
    } catch (e) {
      if ((e as { errorFields?: unknown })?.errorFields) return; // antd validation
    }
  };

  const openDefaults = async () => {
    setDefaultsOpen(true);
    setLoadingDefaults(true);
    try {
      const data = await HrmProjectService.listDefaultTasks(getOrganizationId());
      setDefaultTasks(Array.isArray(data) ? data : []);
    } catch {
      message.error('Failed to load default tasks');
    } finally {
      setLoadingDefaults(false);
    }
  };

  const addDefault = (t: ProjectTaskResponse) =>
    createTask(selectedProject.handle, {
      taskName: t.taskName,
      description: t.description,
      estimatedHours: t.estimatedHours,
      billableRate: t.billableRate,
      billable: t.billable,
      isDefault: false,
    });

  const doImport = async () => {
    if (!importSource) return;
    await importTasks(selectedProject.handle, importSource);
    setImportOpen(false);
    setImportSource(undefined);
  };

  const columns: ColumnsType<ProjectTask> = [
    {
      title: 'Task',
      dataIndex: 'taskName',
      key: 'taskName',
      render: (name: string, t) => (
        <div>
          <Space size={6}>
            <Text strong>{name}</Text>
            {t.isDefault && <Tag color="gold" icon={<StarOutlined />}>Default</Tag>}
          </Space>
          {t.description && <div><Text type="secondary" style={{ fontSize: 12 }}>{t.description}</Text></div>}
        </div>
      ),
    },
    { title: 'Est. Hrs', dataIndex: 'estimatedHours', key: 'estimatedHours', width: 90, align: 'right' },
    { title: 'Actual', dataIndex: 'actualHours', key: 'actualHours', width: 80, align: 'right', render: (v?: number) => v ?? 0 },
    { title: 'Rate/hr', dataIndex: 'billableRate', key: 'billableRate', width: 90, align: 'right', render: (v?: number | null) => (v ? v : <Text type="secondary">—</Text>) },
    {
      title: 'Billable', dataIndex: 'billable', key: 'billable', width: 100,
      render: (v: boolean) => (v ? <Tag color="green">Billable</Tag> : <Tag>Non-Bill</Tag>),
    },
    {
      title: 'Actions', key: 'actions', width: 90, align: 'right',
      render: (_, t) => (
        <Space size={2}>
          <Can I="edit">
            <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(t)} disabled={!canEditTasks} /></Tooltip>
          </Can>
          <Can I="delete">
            {canEditTasks ? (
              <Popconfirm title="Remove this task? Any allocations on it will be cancelled." okText="Remove" okType="danger" onConfirm={() => removeTask(selectedProject.handle, t.handle)}>
                <Tooltip title="Remove"><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
              </Popconfirm>
            ) : (
              <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled />
            )}
          </Can>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      {!canEditTasks && (
        <Alert type="info" showIcon message={blockedReason} style={{ marginBottom: 12 }} />
      )}
      {projectEst > 0 && (
        estDiff === 0 ? (
          <Alert type="success" showIcon message={`Tasks cover the full estimate — ${taskEstTotal} h of ${projectEst} h`} style={{ marginBottom: 12 }} />
        ) : estDiff > 0 ? (
          <Alert type="warning" showIcon message={`${estDiff} h unplanned — task estimates total ${taskEstTotal} h of the ${projectEst} h project estimate`} style={{ marginBottom: 12 }} />
        ) : (
          <Alert type="error" showIcon message={`Over-planned by ${Math.abs(estDiff)} h — task estimates total ${taskEstTotal} h, exceeding the ${projectEst} h project estimate`} style={{ marginBottom: 12 }} />
        )
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
        <Can I="add">
          <Button icon={<StarOutlined />} onClick={openDefaults} disabled={!canEditTasks}>Add Default</Button>
          <Button icon={<ImportOutlined />} onClick={() => setImportOpen(true)} disabled={!canEditTasks}>Import from Project</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!canEditTasks}>Add Task</Button>
        </Can>
      </div>

      <Table<ProjectTask>
        rowKey="handle"
        columns={columns}
        dataSource={tasks}
        size="small"
        pagination={false}
        locale={{ emptyText: 'No tasks yet' }}
      />

      {/* Create / Edit task */}
      <Modal
        title={editing ? 'Edit Task' : 'New Task'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editing ? 'Update' : 'Add'}
        destroyOnHidden
        maskClosable={false}
        keyboard={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="taskName" label="Task Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. UI Design" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Space style={{ display: 'flex' }}>
            <Form.Item name="estimatedHours" label="Estimated Hours" style={{ flex: 1 }}>
              <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="billableRate" label="Billable Rate / hr" style={{ flex: 1 }}>
              <InputNumber min={0} step={1} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Space size={32}>
            <Form.Item name="billable" label="Billable" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isDefault" label="Mark as Default Task" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      {/* Add from default tasks */}
      <Modal
        title="Add Default / Frequent Tasks"
        open={defaultsOpen}
        onCancel={() => setDefaultsOpen(false)}
        footer={[<Button key="close" onClick={() => setDefaultsOpen(false)}>Close</Button>]}
        destroyOnHidden
      >
        <Table<ProjectTaskResponse>
          rowKey="handle"
          loading={loadingDefaults}
          dataSource={defaultTasks}
          size="small"
          pagination={false}
          locale={{ emptyText: 'No default tasks' }}
          columns={[
            { title: 'Task', dataIndex: 'taskName', key: 'taskName' },
            { title: 'Est. Hrs', dataIndex: 'estimatedHours', key: 'estimatedHours', width: 80, align: 'right' },
            {
              title: '', key: 'add', width: 70, align: 'right',
              render: (_, t) => <Button size="small" type="link" onClick={() => addDefault(t)}>Add</Button>,
            },
          ]}
        />
      </Modal>

      {/* Import from existing project */}
      <Modal
        title="Import Tasks from Project"
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        onOk={doImport}
        okText="Import All"
        okButtonProps={{ disabled: !importSource }}
        destroyOnHidden
      >
        <Text type="secondary">Copy all tasks from another project into this one.</Text>
        <Select
          style={{ width: '100%', marginTop: 12 }}
          placeholder="Select source project"
          showSearch
          value={importSource}
          onChange={setImportSource}
          filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          options={projects
            .filter((p) => p.handle !== selectedProject.handle)
            .map((p) => ({ value: p.handle, label: `${p.projectCode} - ${p.projectName}` }))}
        />
      </Modal>
    </div>
  );
}
