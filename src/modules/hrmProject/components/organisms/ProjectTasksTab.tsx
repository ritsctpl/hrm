'use client';
import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, Switch, Space, Tag, Popconfirm,
  Select, Typography, Tooltip, Alert, Dropdown, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ImportOutlined, StarOutlined, DownOutlined, SwapOutlined, MergeCellsOutlined, FieldTimeOutlined, WarningOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import { HrmProjectService } from '../../services/hrmProjectService';
import ExtendTaskModal from './ExtendTaskModal';
import type { ProjectTask, TaskStatus } from '../../types/domain.types';
import type { ProjectTaskResponse } from '../../types/api.types';
import type { TaskFormValues } from '../../types/ui.types';
import Can from '../../../hrmAccess/components/Can';

const { Text } = Typography;

const TASK_STATUS: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: 'Not started', color: 'default' },
  IN_PROGRESS: { label: 'In progress', color: 'blue' },
  COMPLETED: { label: 'Completed', color: 'green' },
  BLOCKED: { label: 'Blocked', color: 'red' },
};
const TASK_STATUS_KEYS: TaskStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'];

// Match the Reports smart-table: sticky header, body scrolls, no pagination.
const TABLE_SCROLL = { x: 'max-content' as const, y: 'calc(100vh - 360px)' };

export default function ProjectTasksTab() {
  const { selectedProject, projects } = useHrmProjectStore();
  const { createTask, updateTask, removeTask, importTasks, updateTaskStatus, moveTaskToProject, mergeTasks } = useProjectMutations();
  const { employeeCode } = useEmployeeIdentity();
  const [extendTarget, setExtendTarget] = useState<ProjectTask | null>(null);
  const [form] = Form.useForm<TaskFormValues>();
  const [editing, setEditing] = useState<ProjectTask | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultsOpen, setDefaultsOpen] = useState(false);
  const [defaultTasks, setDefaultTasks] = useState<ProjectTaskResponse[]>([]);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importSource, setImportSource] = useState<string | undefined>();
  // Move task to another project
  const [moveTarget, setMoveTarget] = useState<ProjectTask | null>(null);
  const [moveDest, setMoveDest] = useState<string | undefined>();
  const [moveAllocations, setMoveAllocations] = useState(true);
  // Merge tasks
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState<string | undefined>();
  const [mergeSourceIds, setMergeSourceIds] = useState<string[]>([]);

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

  // Over-budget: actuals reached the estimate and the task isn't complete → needs a PM decision.
  const isPM = !!employeeCode && employeeCode === selectedProject.projectManagerId;
  const isOverBudget = (t: ProjectTask) =>
    (t.estimatedHours ?? 0) > 0 && (t.actualHours ?? 0) >= (t.estimatedHours ?? 0) && t.status !== 'COMPLETED';
  const overBudgetTasks = tasks.filter(isOverBudget);

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
      milestoneId: t.milestoneId ?? undefined,
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

  const doMoveTask = async () => {
    if (!moveTarget || !moveDest) return;
    await moveTaskToProject(selectedProject.handle, { taskHandle: moveTarget.handle, targetProjectHandle: moveDest, moveAllocations });
    setMoveTarget(null);
    setMoveDest(undefined);
    setMoveAllocations(true);
  };

  const doMerge = async () => {
    if (!mergeTargetId || mergeSourceIds.length === 0) return;
    await mergeTasks(selectedProject.handle, { sourceTaskHandles: mergeSourceIds, targetTaskHandle: mergeTargetId });
    setMergeOpen(false);
    setMergeTargetId(undefined);
    setMergeSourceIds([]);
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
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 140,
      filters: TASK_STATUS_KEYS.map((k) => ({ text: TASK_STATUS[k].label, value: k })),
      onFilter: (v, t) => (t.status ?? 'NOT_STARTED') === v,
      render: (s: TaskStatus | undefined, t) => {
        const stored = (s ?? 'NOT_STARTED') as TaskStatus;
        // A task with logged timesheet hours can't be "Not started" — show it as In progress
        // until the backend auto-advances it (or someone sets a status manually).
        const autoProgress = stored === 'NOT_STARTED' && (t.actualHours ?? 0) > 0;
        const cur = TASK_STATUS[autoProgress ? 'IN_PROGRESS' : stored];
        const tag = <Tag color={cur.color} style={{ cursor: canEditTasks ? 'pointer' : 'default', margin: 0 }}>{cur.label}{canEditTasks && <DownOutlined style={{ fontSize: 9, marginLeft: 4 }} />}</Tag>;
        const inner = canEditTasks ? (
          <Dropdown
            trigger={['click']}
            menu={{
              items: TASK_STATUS_KEYS.map((k) => ({ key: k, label: TASK_STATUS[k].label })),
              onClick: ({ key }) => updateTaskStatus(selectedProject.handle, t.handle, key as TaskStatus),
            }}
          >
            {tag}
          </Dropdown>
        ) : tag;
        return autoProgress
          ? <Tooltip title={`${t.actualHours} h logged — shown as In progress`}>{inner}</Tooltip>
          : inner;
      },
    },
    {
      title: 'Milestone', dataIndex: 'milestoneId', key: 'milestoneId', width: 130,
      filters: (selectedProject.milestones ?? []).map((m) => ({ text: m.milestoneName, value: m.milestoneId })),
      onFilter: (v, t) => t.milestoneId === v,
      render: (id?: string | null) => {
        const m = (selectedProject.milestones ?? []).find((x) => x.milestoneId === id);
        return m ? <Text style={{ fontSize: 12 }}>{m.milestoneName}</Text> : <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Est. Hrs', dataIndex: 'estimatedHours', key: 'estimatedHours', width: 110, align: 'right',
      sorter: (a, b) => (a.estimatedHours || 0) - (b.estimatedHours || 0),
      render: (v: number, t) => {
        const exts = t.extensions ?? [];
        const added = exts.reduce((s, e) => s + (e.additionalHours || 0), 0);
        return (
          <span>
            {v}
            {added > 0 && (
              <Tooltip title={exts.map((e) => `+${e.additionalHours}h · ${e.extendedByName || e.extendedBy}${e.reason ? ` · ${e.reason}` : ''}`).join('\n')}>
                <Tag color="gold" style={{ marginLeft: 6 }}>+{added}h</Tag>
              </Tooltip>
            )}
          </span>
        );
      },
    },
    {
      title: 'Actual', dataIndex: 'actualHours', key: 'actualHours', width: 90, align: 'right',
      sorter: (a, b) => (a.actualHours || 0) - (b.actualHours || 0),
      render: (v: number | undefined, t) => {
        const actual = v ?? 0;
        return isOverBudget(t)
          ? <Tooltip title="Reached the estimate — needs complete or extend"><Text type="danger" strong>{actual} <WarningOutlined /></Text></Tooltip>
          : actual;
      },
    },
    { title: 'Rate/hr', dataIndex: 'billableRate', key: 'billableRate', width: 90, align: 'right', render: (v?: number | null) => (v ? v : <Text type="secondary">—</Text>) },
    {
      title: 'Billable', dataIndex: 'billable', key: 'billable', width: 100,
      filters: [{ text: 'Billable', value: true }, { text: 'Non-Bill', value: false }],
      onFilter: (v, t) => Boolean(t.billable) === v,
      render: (v: boolean) => (v ? <Tag color="green">Billable</Tag> : <Tag>Non-Bill</Tag>),
    },
    {
      title: 'Actions', key: 'actions', width: 120, align: 'right',
      render: (_, t) => (
        <Space size={2}>
          <Can I="edit">
            <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(t)} disabled={!canEditTasks} /></Tooltip>
          </Can>
          {isOverBudget(t) && isPM && (
            <Tooltip title="Extend task time"><Button type="text" size="small" icon={<FieldTimeOutlined />} style={{ color: '#fa8c16' }} onClick={() => setExtendTarget(t)} /></Tooltip>
          )}
          <Can I="edit">
            <Tooltip title="Move to another project"><Button type="text" size="small" icon={<SwapOutlined />} onClick={() => setMoveTarget(t)} disabled={!canEditTasks} /></Tooltip>
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
      {overBudgetTasks.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={`${overBudgetTasks.length} task${overBudgetTasks.length > 1 ? 's' : ''} reached the estimate: ${overBudgetTasks.map((t) => t.taskName).join(', ')}`}
          description={isPM
            ? 'Time logging on these is blocked until you mark them Complete or Extend the time.'
            : "These are blocked for time logging until the project manager completes or extends them."}
        />
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
          <Button icon={<MergeCellsOutlined />} onClick={() => setMergeOpen(true)} disabled={!canEditTasks || tasks.length < 2}>Merge</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!canEditTasks}>Add Task</Button>
        </Can>
      </div>

      <Table<ProjectTask>
        rowKey="handle"
        columns={columns}
        dataSource={tasks}
        size="small"
        pagination={false}
        scroll={TABLE_SCROLL}
        sticky
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
          <Form.Item name="milestoneId" label="Deliverable / Milestone">
            <Select
              allowClear
              placeholder="Link to a milestone (optional)"
              options={(selectedProject.milestones ?? []).map((m) => ({ value: m.milestoneId, label: m.milestoneName }))}
              notFoundContent="No milestones on this project"
            />
          </Form.Item>
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

      {/* Move task to another project */}
      <Modal
        title={`Move task: ${moveTarget?.taskName ?? ''}`}
        open={!!moveTarget}
        onCancel={() => { setMoveTarget(null); setMoveDest(undefined); setMoveAllocations(true); }}
        onOk={doMoveTask}
        okText="Move task"
        okButtonProps={{ disabled: !moveDest }}
        destroyOnHidden
      >
        <Text type="secondary">Move this task to another project. Its estimate is re-checked against the target project.</Text>
        <Select
          style={{ width: '100%', marginTop: 12 }}
          placeholder="Select target project"
          showSearch
          value={moveDest}
          onChange={setMoveDest}
          filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          options={projects
            .filter((p) => p.handle !== selectedProject.handle)
            .map((p) => ({ value: p.handle, label: `${p.projectCode} - ${p.projectName}` }))}
        />
        <div style={{ marginTop: 12 }}>
          <Switch checked={moveAllocations} onChange={setMoveAllocations} size="small" />{' '}
          <Text>Move its resource allocations too</Text>
        </div>
      </Modal>

      {/* Merge tasks */}
      <Modal
        title="Merge tasks"
        open={mergeOpen}
        onCancel={() => { setMergeOpen(false); setMergeTargetId(undefined); setMergeSourceIds([]); }}
        onOk={doMerge}
        okText="Merge"
        okButtonProps={{ disabled: !mergeTargetId || mergeSourceIds.length === 0 }}
        destroyOnHidden
      >
        <Text type="secondary">Allocations and timesheet entries from the source tasks move into the target task; the source tasks are removed.</Text>
        <div style={{ marginTop: 12 }}>
          <Text strong style={{ fontSize: 12 }}>Keep (target task)</Text>
          <Select
            style={{ width: '100%', marginTop: 4 }}
            placeholder="Task to keep"
            value={mergeTargetId}
            onChange={(v) => { setMergeTargetId(v); setMergeSourceIds((ids) => ids.filter((id) => id !== v)); }}
            options={tasks.map((t) => ({ value: t.handle, label: t.taskName }))}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <Text strong style={{ fontSize: 12 }}>Merge in (source tasks)</Text>
          <Select
            mode="multiple"
            style={{ width: '100%', marginTop: 4 }}
            placeholder="Tasks to merge into the target"
            value={mergeSourceIds}
            onChange={setMergeSourceIds}
            options={tasks.filter((t) => t.handle !== mergeTargetId).map((t) => ({ value: t.handle, label: t.taskName }))}
          />
        </div>
      </Modal>

      <ExtendTaskModal
        open={!!extendTarget}
        task={extendTarget}
        project={selectedProject}
        onClose={() => setExtendTarget(null)}
      />

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
