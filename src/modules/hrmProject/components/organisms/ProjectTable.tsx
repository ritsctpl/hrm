'use client';
import React from 'react';
import { Table, Tag, Button, Space, Popconfirm, Progress, Typography, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Project } from '../../types/domain.types';
import ProjectStatusBadge from '../atoms/ProjectStatusBadge';
import ProjectSearchBar from '../molecules/ProjectSearchBar';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { formatDate } from '../../utils/projectHelpers';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/ProjectList.module.css';

const { Text } = Typography;

interface ProjectTableProps {
  projects: Project[];
  loading: boolean;
  onView: (project: Project) => void;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ projects, loading, onView }) => {
  const { openProjectForm } = useHrmProjectStore();
  const { deleteProject } = useProjectMutations();

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
      width: 130,
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
    </div>
  );
};

export default ProjectTable;
