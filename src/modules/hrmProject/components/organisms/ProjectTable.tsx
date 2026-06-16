'use client';
import React, { useState } from 'react';
import { Table, Tag, Button, Space, Popconfirm, Progress, Typography, Tooltip, Modal, Form, Input, Switch, message } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined, CopyOutlined, InboxOutlined, ExportOutlined } from '@ant-design/icons';
import { parseCookies } from 'nookies';
import type { ColumnsType } from 'antd/es/table';
import type { Project } from '../../types/domain.types';
import ProjectStatusBadge from '../atoms/ProjectStatusBadge';
import ProjectSearchBar from '../molecules/ProjectSearchBar';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import { formatDate } from '../../utils/projectHelpers';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/ProjectList.module.css';

const { Text } = Typography;

interface ProjectTableProps {
  projects: Project[];
  loading: boolean;
  onView: (project: Project) => void;
}

interface CloneForm { newProjectName: string; includeTasks: boolean; includeMilestones: boolean; includeAllocations: boolean }

const ProjectTable: React.FC<ProjectTableProps> = ({ projects, loading, onView }) => {
  const { openProjectForm, savingProject } = useHrmProjectStore();
  const { deleteProject, cloneProject, setProjectArchived } = useProjectMutations();
  const { employeeCode } = useEmployeeIdentity();
  const [cloneSource, setCloneSource] = useState<Project | null>(null);
  const [cloneForm] = Form.useForm<CloneForm>();

  const actor = () => employeeCode || parseCookies().employeeCode || parseCookies().rl_user_id || parseCookies().user || '';

  const openClone = (p: Project) => {
    setCloneSource(p);
    cloneForm.setFieldsValue({ newProjectName: `${p.projectName} (copy)`, includeTasks: true, includeMilestones: true, includeAllocations: false });
  };
  const doClone = async () => {
    const values = await cloneForm.validateFields();
    if (!cloneSource) return;
    await cloneProject({ sourceProjectHandle: cloneSource.handle, ...values }, actor());
    setCloneSource(null);
  };
  const doArchive = (p: Project, archived: boolean) => {
    const a = actor();
    if (!a) { message.error('Could not identify the signed-in user'); return; }
    setProjectArchived(p.handle, archived, '', a);
  };

  const columns: ColumnsType<Project> = [
    {
      title: 'Project',
      key: 'project',
      render: (_, p) => (
        <div className={styles.cellProject}>
          <Text strong>{p.projectName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{p.projectCode}</Text>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'projectType',
      key: 'projectType',
      width: 150,
      render: (t: string) => {
        const map: Record<string, { color: string; label: string }> = {
          BILLABLE: { color: 'green', label: 'Billable' },
          NON_BILLABLE: { color: 'default', label: 'Non-Billable' },
          REVENUE_GENERATION: { color: 'gold', label: 'Revenue Gen' },
        };
        const m = map[t] ?? { color: 'blue', label: t };
        return <Tag color={m.color}>{m.label}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (_, p) => <ProjectStatusBadge status={p.status} />,
    },
    {
      title: 'Manager',
      dataIndex: 'projectManagerName',
      key: 'projectManagerName',
      width: 160,
      render: (name: string) => name || <Text type="secondary">—</Text>,
    },
    {
      title: 'Progress',
      key: 'progress',
      width: 140,
      render: (_, p) => (
        <Progress percent={Math.min(p.utilizationPercentage ?? 0, 100)} size="small" />
      ),
    },
    {
      title: 'Timeline',
      key: 'timeline',
      width: 180,
      render: (_, p) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatDate(p.startDate)} → {formatDate(p.endDate)}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      align: 'right',
      render: (_, p) => (
        <Space size={4} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => onView(p)} />
          </Tooltip>
          <Can I="edit">
            <Tooltip title="Edit">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openProjectForm(p)} />
            </Tooltip>
          </Can>
          <Can I="add">
            <Tooltip title="Clone">
              <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => openClone(p)} />
            </Tooltip>
          </Can>
          <Can I="edit">
            {p.archived ? (
              <Tooltip title="Unarchive">
                <Button type="text" size="small" icon={<ExportOutlined />} onClick={() => doArchive(p, false)} />
              </Tooltip>
            ) : (
              <Popconfirm title="Archive this project? It hides from the list but keeps history." okText="Archive" onConfirm={() => doArchive(p, true)}>
                <Tooltip title="Archive">
                  <Button type="text" size="small" icon={<InboxOutlined />} />
                </Tooltip>
              </Popconfirm>
            )}
          </Can>
          <Can I="delete">
            <Popconfirm title="Delete this project?" okText="Delete" okType="danger" onConfirm={() => deleteProject(p.handle)}>
              <Tooltip title="Delete">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Can>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableToolbar}>
        <div className={styles.tableSearch}>
          <ProjectSearchBar />
        </div>
        <Can I="add">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openProjectForm()}>
            New Project
          </Button>
        </Can>
      </div>
      <Table<Project>
        rowKey="handle"
        columns={columns}
        dataSource={projects}
        loading={loading}
        size="middle"
        pagination={{ pageSize: 10, hideOnSinglePage: true, showSizeChanger: false }}
        onRow={(p) => ({ onClick: () => onView(p), style: { cursor: 'pointer' } })}
        locale={{ emptyText: 'No projects found' }}
      />

      <Modal
        title={`Clone project: ${cloneSource?.projectName ?? ''}`}
        open={!!cloneSource}
        onCancel={() => setCloneSource(null)}
        onOk={doClone}
        okText="Clone"
        confirmLoading={savingProject}
        destroyOnHidden
      >
        <Form form={cloneForm} layout="vertical">
          <Form.Item name="newProjectName" label="New project name" rules={[{ required: true, message: 'Enter a name' }]}>
            <Input placeholder="New project name" />
          </Form.Item>
          <Form.Item name="includeTasks" label="Copy tasks" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="includeMilestones" label="Copy milestones" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="includeAllocations" label="Copy allocations (as draft)" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectTable;
