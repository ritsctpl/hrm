'use client';
import React, { useState } from 'react';
import { Table, Tag, Button, Space, Popconfirm, Typography, Tooltip, Modal, Form, Input, Switch, message } from 'antd';
import { EyeOutlined, DeleteOutlined, PlusOutlined, CopyOutlined, InboxOutlined, ExportOutlined } from '@ant-design/icons';
import { parseCookies } from 'nookies';
import type { ColumnsType } from 'antd/es/table';
import type { Project } from '../../types/domain.types';
import ProjectStatusBadge from '../atoms/ProjectStatusBadge';
import ProjectSearchBar from '../molecules/ProjectSearchBar';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import { employeeLabelOf } from '@/utils/employeeIdentity';
import { formatDate } from '../../utils/projectHelpers';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/ProjectList.module.css';

const { Text } = Typography;

// Fit to screen vertically; let wide tables scroll horizontally instead of squishing.
// Mirrors the Reports tab smart-table behaviour (pagination off, sticky header, body scrolls).
const TABLE_SCROLL = { x: 'max-content' as const, y: 'calc(100vh - 280px)' };

// Default render is capped to this many rows; searching/filtering lifts the cap.
const DEFAULT_ROW_CAP = 50;

const uniq = <T,>(arr: T[]): T[] => Array.from(new Set(arr));

interface ProjectTableProps {
  projects: Project[];
  loading: boolean;
  onView: (project: Project) => void;
}

interface CloneForm { newProjectName: string; includeTasks: boolean; includeMilestones: boolean; includeAllocations: boolean }

const ProjectTable: React.FC<ProjectTableProps> = ({ projects, loading, onView }) => {
  const { openProjectForm, savingProject, searchQuery, filterBU, filterStatus, filterType, filterClient } = useHrmProjectStore();

  // Show the first 50 by default; once the user searches or picks any toolbar
  // filter, lift the cap so they're searching across the full in-memory list.
  const isFiltering = Boolean(searchQuery || filterBU || filterStatus || filterType || filterClient);
  const visibleProjects = isFiltering ? projects : projects.slice(0, DEFAULT_ROW_CAP);
  const isCapped = !isFiltering && projects.length > DEFAULT_ROW_CAP;
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
      sorter: (a, b) => a.projectName.localeCompare(b.projectName),
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
      filters: [
        { text: 'Billable', value: 'BILLABLE' },
        { text: 'Non-Billable', value: 'NON_BILLABLE' },
        { text: 'Revenue Gen', value: 'REVENUE_GENERATION' },
      ],
      onFilter: (v, p) => p.projectType === v,
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
      title: 'Client',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 150,
      filters: uniq(projects.map((p) => p.clientName).filter(Boolean) as string[]).map((c) => ({ text: c, value: c })),
      onFilter: (v, p) => p.clientName === v,
      render: (c?: string) => c || <Text type="secondary">—</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: uniq(projects.map((p) => p.status)).map((s) => ({ text: s, value: s })),
      onFilter: (v, p) => p.status === v,
      render: (_, p) => <ProjectStatusBadge status={p.status} />,
    },
    {
      title: 'Manager',
      dataIndex: 'projectManagerName',
      key: 'projectManagerName',
      width: 160,
      // Fall back to the id when the name is missing — projects imported with
      // an external manager id have no matching employee to resolve a name
      // from, and showing "—" reads as "no manager assigned", which is wrong.
      render: (_: string, p) => employeeLabelOf(p.projectManagerId, p.projectManagerName) || <Text type="secondary">—</Text>,
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
        <Space>
          <Can I="add">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openProjectForm()}>
              New Project
            </Button>
          </Can>
        </Space>
      </div>
      {isCapped && (
        <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
          Showing first {DEFAULT_ROW_CAP} of {projects.length} — search or filter to see all.
        </Text>
      )}
      <Table<Project>
        rowKey="handle"
        columns={columns}
        dataSource={visibleProjects}
        loading={loading}
        size="middle"
        pagination={false}
        scroll={TABLE_SCROLL}
        sticky
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
