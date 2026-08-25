'use client';
import React, { useState } from 'react';
import { Button, Modal, Form, Input, DatePicker, Table, Select, Space, Tag, Tooltip, Popconfirm, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import { isSameEmployee } from '@/utils/employeeIdentity';
import { formatDate } from '../../utils/projectHelpers';
import type { Milestone, MilestoneStatus } from '../../types/domain.types';
import styles from '../../styles/ProjectDetail.module.css';

const { Text } = Typography;

const MILESTONE_STATUSES: MilestoneStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'];
// Match the Reports smart-table: sticky header, body scrolls, no pagination.
const TABLE_SCROLL = { x: 'max-content' as const, y: 'calc(100vh - 320px)' };

export default function ProjectMilestonesTab() {
  const { selectedProject } = useHrmProjectStore();
  const { updateMilestoneStatus, addMilestone, updateMilestone, removeMilestone } = useProjectMutations();
  const { employeeCode } = useEmployeeIdentity();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [form] = Form.useForm();

  if (!selectedProject) return null;

  // The backend enforces requireProjectManager on every milestone mutation (PRJ_038);
  // gate the UI on the same rule so nothing is offered that the server will reject.
  const isPM = isSameEmployee(employeeCode, selectedProject.projectManagerId);

  const handleStatusChange = (milestoneId: string, status: MilestoneStatus) => {
    const userId = parseCookies().rl_user_id ?? parseCookies().user ?? '';
    updateMilestoneStatus(selectedProject.handle, milestoneId, status, userId);
  };

  const handleRemove = (milestoneId: string) => {
    removeMilestone(selectedProject.handle, milestoneId);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setAddModalOpen(true);
  };

  const handleEdit = (m: Milestone) => {
    setEditing(m);
    form.setFieldsValue({
      milestoneName: m.milestoneName,
      targetDate: m.targetDate ? dayjs(m.targetDate) : null,
      description: m.description,
    });
    setAddModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        milestoneName: values.milestoneName,
        targetDate: values.targetDate.format('YYYY-MM-DD'),
        description: values.description,
      };
      if (editing) {
        await updateMilestone(selectedProject.handle, editing.milestoneId, payload);
      } else {
        await addMilestone(selectedProject.handle, payload);
      }
      setAddModalOpen(false);
      setEditing(null);
      form.resetFields();
    } catch (e) {
      if ((e as { errorFields?: unknown })?.errorFields) return; // antd validation
    }
  };

  const columns: ColumnsType<Milestone> = [
    {
      title: 'Milestone Name', dataIndex: 'milestoneName', key: 'milestoneName',
      sorter: (a, b) => a.milestoneName.localeCompare(b.milestoneName),
      render: (name: string, m) => {
        const linked = (selectedProject.tasks ?? []).filter((t) => t.milestoneId === m.milestoneId);
        const done = linked.filter((t) => t.status === 'COMPLETED').length;
        return (
          <Space size={6}>
            <Text ellipsis={{ tooltip: name }}>{name}</Text>
            {linked.length > 0 && (
              <Tooltip title={`${done} of ${linked.length} linked tasks complete`}>
                <Tag color={done === linked.length ? 'green' : 'blue'} style={{ flexShrink: 0 }}>{done}/{linked.length}</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Target Date', dataIndex: 'targetDate', key: 'targetDate', width: 140,
      sorter: (a, b) => dayjs(a.targetDate).valueOf() - dayjs(b.targetDate).valueOf(),
      render: (d?: string) => <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(d)}</Text>,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 160,
      filters: MILESTONE_STATUSES.map((s) => ({ text: s.replace('_', ' '), value: s })),
      onFilter: (v, m) => m.status === v,
      render: (_, m) => (
        <Select
          value={m.status}
          onChange={(v) => handleStatusChange(m.milestoneId, v as MilestoneStatus)}
          disabled={!isPM}
          style={{ width: '100%' }}
          size="small"
          options={MILESTONE_STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))}
        />
      ),
    },
    {
      title: 'Description', dataIndex: 'description', key: 'description',
      render: (d?: string) => <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: d }}>{d || '—'}</Text>,
    },
    {
      title: 'Actions', key: 'actions', width: 110, align: 'right',
      render: (_, m) => (
        <Space size={2}>
          {isPM && (
            <Tooltip title="Edit"><Button size="small" type="link" icon={<EditOutlined />} onClick={() => handleEdit(m)} /></Tooltip>
          )}
          {isPM && (
            <Popconfirm title="Remove this milestone?" onConfirm={() => handleRemove(m.milestoneId)}>
              <Tooltip title="Remove"><Button size="small" type="link" danger icon={<DeleteOutlined />} /></Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.milestonesTab}>
      <div className={styles.tabHeader}>
        {isPM && (
          <Button type="primary" ghost icon={<PlusOutlined />} size="small" onClick={openCreate}>
            Add Milestone
          </Button>
        )}
      </div>
      <Table<Milestone>
        rowKey="milestoneId"
        columns={columns}
        dataSource={selectedProject.milestones}
        size="small"
        pagination={false}
        scroll={TABLE_SCROLL}
        sticky
        locale={{ emptyText: 'No milestones defined' }}
      />

      <Modal
        title={editing ? 'Edit Milestone' : 'Add Milestone'}
        open={addModalOpen}
        onCancel={() => { setAddModalOpen(false); setEditing(null); }}
        destroyOnHidden
        maskClosable={false}
        keyboard={false}
        footer={[
          <Button key="cancel" onClick={() => { setAddModalOpen(false); setEditing(null); }}>Cancel</Button>,
          <Button key="ok" type="primary" onClick={handleSave}>{editing ? 'Update' : 'OK'}</Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="milestoneName" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="targetDate" label="Target Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
